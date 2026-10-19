<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A curated list ("Best of Doon") referencing real entities.
 */
class Collection extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    protected $fillable = [
        'title', 'slug', 'description', 'selection_criteria', 'status', 'is_featured',
        'curator_id', 'cover_media_id', 'published_at', 'metadata',
    ];

    protected $attributes = [
        'status' => 'DRAFT',
    ];

    public function slugSource(): string
    {
        return 'title';
    }

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function scopePublic(Builder $query): void
    {
        $query->where('status', PublicationStatus::Published->value)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function isPublic(): bool
    {
        return $this->status === PublicationStatus::Published
            && $this->published_at !== null
            && $this->published_at->lte(now());
    }

    public function isDemo(): bool
    {
        return (bool) ($this->metadata['demo'] ?? false);
    }

    public function curator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'curator_id');
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CollectionItem::class)->orderBy('position');
    }
}
