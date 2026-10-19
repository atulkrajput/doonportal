<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Enums\StoryType;
use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Story extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    protected $fillable = [
        'type', 'title', 'slug', 'excerpt', 'body', 'status', 'is_featured', 'author_id', 'cover_media_id',
        'reading_minutes', 'seo_title', 'seo_description', 'published_at', 'metadata',
    ];

    protected $attributes = [
        'status' => 'DRAFT',
        'type' => 'STORY',
    ];

    public function slugSource(): string
    {
        return 'title';
    }

    protected function casts(): array
    {
        return [
            'type' => StoryType::class,
            'status' => PublicationStatus::class,
            'is_featured' => 'boolean',
            'reading_minutes' => 'integer',
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

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'story_category');
    }

    public function entityLinks(): HasMany
    {
        return $this->hasMany(StoryEntity::class);
    }

    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }
}
