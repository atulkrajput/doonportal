<?php

namespace App\Services\BusinessImages;

use App\Models\Business;
use App\Models\Media;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Business images (logo, cover, gallery) live in one folder on the public
 * disk, apart from the editorial media library, named after their business:
 * businesses/<business id>_<kind>-<random>.<ext> (kind: logo, cover, photo).
 *
 * Every image is checked from its bytes (never the file name or the
 * sender's content type); when GD is available it is also resized and
 * re-encoded, which strips EXIF/location data and any non-image payload.
 */
class BusinessImageStore
{
    public const DISK = 'public';

    public const MAX_BYTES = 5 * 1024 * 1024;

    public const MAX_EDGE = 1600;

    public const MIN_EDGE = 120;

    public const FOLDER = 'businesses';

    public const KINDS = ['logo', 'cover', 'photo'];

    private const TYPES = [IMAGETYPE_JPEG => ['image/jpeg', 'jpg'], IMAGETYPE_PNG => ['image/png', 'png'], IMAGETYPE_WEBP => ['image/webp', 'webp']];

    /**
     * File name prefix shared by all of a business's images.
     */
    public static function prefix(Business|string $business): string
    {
        return self::FOLDER.'/'.strtolower($business instanceof Business ? $business->id : $business).'_';
    }

    /**
     * Is this media one of this business's own images (so an owner can't point at someone else's)?
     */
    public static function belongsTo(Media $media, Business $business): bool
    {
        return $media->disk === self::DISK && str_starts_with((string) $media->path, self::prefix($business));
    }

    /**
     * @param  array{alt_text?: ?string, credit?: ?string, source_url?: ?string}  $details
     */
    public function storeUpload(UploadedFile $file, Business $business, string $kind, array $details = []): Media
    {
        if ($file->getSize() > self::MAX_BYTES) {
            throw new RuntimeException('Images can be up to 5 MB.');
        }

        return $this->storeBytes((string) file_get_contents($file->getRealPath()), $business, $kind, $details);
    }

    /**
     * Download an image from a public URL (OpenStreetMap / Wikimedia / a business website).
     *
     * @param  array{alt_text?: ?string, credit?: ?string, source_url?: ?string}  $details
     */
    public function storeFromUrl(string $url, Business $business, string $kind, array $details = []): Media
    {
        if (! SafeUrl::isFetchable($url)) {
            throw new RuntimeException('That image address is not allowed.');
        }

        try {
            $response = Http::timeout(15)->withOptions(SafeUrl::redirectOptions())
                ->withHeaders(['User-Agent' => config('discovery.user_agent'), 'Accept' => 'image/*'])
                ->get($url);
        } catch (ConnectionException $e) {
            throw new RuntimeException('The image could not be downloaded.', previous: $e);
        }
        if ($response->failed()) {
            throw new RuntimeException("The image could not be downloaded (HTTP {$response->status()}).");
        }
        $bytes = $response->body();
        if (strlen($bytes) > self::MAX_BYTES) {
            throw new RuntimeException('The image is larger than 5 MB.');
        }

        return $this->storeBytes($bytes, $business, $kind, $details + ['source_url' => $url]);
    }

    /**
     * @param  array{alt_text?: ?string, credit?: ?string, source_url?: ?string}  $details
     */
    private function storeBytes(string $bytes, Business $business, string $kind, array $details): Media
    {
        if (! in_array($kind, self::KINDS, true)) {
            throw new RuntimeException("Unknown image kind [{$kind}].");
        }
        $info = @getimagesizefromstring($bytes);
        if (! $info || ! isset(self::TYPES[$info[2]])) {
            throw new RuntimeException('Only JPEG, PNG and WebP images are accepted.');
        }
        [$width, $height, $type] = $info;
        if (min($width, $height) < self::MIN_EDGE || max($width, $height) > 12000) {
            throw new RuntimeException('The image is too small (or too large) to use.');
        }

        [$mime, $extension] = self::TYPES[$type];
        if ($processed = $this->reencode($bytes, $type, $width, $height)) {
            [$bytes, $width, $height, $mime, $extension] = $processed;
        }

        // e.g. businesses/01jab…_cover-x7k2m9.jpg: one folder, named after the business; the
        // random part keeps an old file (and browser caches) from being overwritten.
        $path = self::prefix($business).$kind.'-'.Str::lower(Str::random(6)).'.'.$extension;
        Storage::disk(self::DISK)->put($path, $bytes);

        try {
            return Media::create([
                'disk' => self::DISK,
                'path' => $path,
                'mime_type' => $mime,
                'size_bytes' => strlen($bytes),
                'width' => $width,
                'height' => $height,
                'alt_text' => isset($details['alt_text']) ? Str::limit($details['alt_text'], 250, '') : null,
                'credit' => isset($details['credit']) ? Str::limit($details['credit'], 250, '') : null,
                'source_url' => $details['source_url'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Storage::disk(self::DISK)->delete($path);

            throw $e;
        }
    }

    /**
     * Resize to at most MAX_EDGE and re-encode (JPEG, or WebP/PNG to keep transparency).
     *
     * @return array{0: string, 1: int, 2: int, 3: string, 4: string}|null null when GD is not installed
     */
    private function reencode(string $bytes, int $type, int $width, int $height): ?array
    {
        if (! function_exists('imagecreatefromstring')) {
            return null;
        }
        $source = @imagecreatefromstring($bytes);
        if (! $source) {
            throw new RuntimeException('The image could not be read.');
        }

        $scale = min(1, self::MAX_EDGE / max($width, $height));
        $w = max(1, (int) round($width * $scale));
        $h = max(1, (int) round($height * $scale));
        $target = imagecreatetruecolor($w, $h);
        $keepAlpha = $type !== IMAGETYPE_JPEG;
        if ($keepAlpha) {
            imagealphablending($target, false);
            imagesavealpha($target, true);
        }
        imagecopyresampled($target, $source, 0, 0, 0, 0, $w, $h, $width, $height);

        ob_start();
        if ($keepAlpha && function_exists('imagewebp')) {
            imagewebp($target, null, 82);
            [$mime, $extension] = ['image/webp', 'webp'];
        } elseif ($keepAlpha) {
            imagepng($target, null, 7);
            [$mime, $extension] = ['image/png', 'png'];
        } else {
            imagejpeg($target, null, 82);
            [$mime, $extension] = ['image/jpeg', 'jpg'];
        }
        $out = (string) ob_get_clean();
        imagedestroy($source);
        imagedestroy($target);

        return [$out, $w, $h, $mime, $extension];
    }
}
