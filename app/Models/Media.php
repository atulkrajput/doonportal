<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'disk', 'path', 'external_url', 'mime_type', 'size_bytes', 'width', 'height',
        'alt_text', 'credit', 'source_url', 'uploaded_by',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'uploaded_by');
    }

    public function url(): ?string
    {
        if ($this->path) {
            return Storage::disk($this->disk)->url($this->path);
        }

        return $this->external_url;
    }
}
