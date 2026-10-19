<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Editor overrides for a site path (e.g. "/events") or a single record.
 */
class SeoMeta extends Model
{
    use HasUlids;

    protected $table = 'seo_meta';

    protected $fillable = ['path', 'entity_type', 'entity_id', 'title', 'description', 'image_media_id', 'noindex', 'updated_by'];

    protected function casts(): array
    {
        return ['noindex' => 'boolean'];
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'image_media_id');
    }
}
