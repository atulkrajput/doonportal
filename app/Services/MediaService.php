<?php

namespace App\Services;

use App\Models\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Stores validated image uploads. Files go to the `public` disk for now (object
 * storage later); the stored name and extension come from the server-detected
 * MIME type, never from the client's file name.
 */
class MediaService
{
    public const DISK = 'public';

    public const MAX_KILOBYTES = 5120;

    public const MAX_DIMENSION = 8000;

    /** Raster formats only: SVG can carry script and is deliberately excluded. */
    public const MIME_EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @param  array{alt_text?: ?string, credit?: ?string, source_url?: ?string}  $details
     */
    public function store(UploadedFile $file, User $uploader, array $details = []): Media
    {
        $mime = (string) $file->getMimeType();
        $extension = self::MIME_EXTENSIONS[$mime] ?? throw new \InvalidArgumentException("Unsupported media type [{$mime}].");
        [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

        $path = $file->storeAs('media/'.now()->format('Y/m'), Str::lower((string) Str::ulid()).'.'.$extension, self::DISK);

        try {
            return DB::transaction(function () use ($path, $mime, $file, $width, $height, $details, $uploader) {
                $media = Media::create([
                    'disk' => self::DISK,
                    'path' => $path,
                    'mime_type' => $mime,
                    'size_bytes' => $file->getSize(),
                    'width' => $width,
                    'height' => $height,
                    'alt_text' => $details['alt_text'] ?? null,
                    'credit' => $details['credit'] ?? null,
                    'source_url' => $details['source_url'] ?? null,
                    'uploaded_by' => $uploader->id,
                ]);

                $this->audit->log('media.uploaded', $media, null, [
                    'path' => $path, 'mime_type' => $mime, 'size_bytes' => $file->getSize(),
                ], $uploader);

                return $media;
            });
        } catch (\Throwable $e) {
            Storage::disk(self::DISK)->delete($path);

            throw $e;
        }
    }
}
