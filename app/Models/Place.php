<?php

namespace App\Models;

use App\Enums\PhotoStatus;
use App\Enums\PublicationStatus;
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

class Place extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'summary', 'description', 'status', 'is_featured',
        'address_line', 'primary_area_id', 'latitude', 'longitude',
        'timings', 'is_free', 'entry_fee_min_paise', 'entry_fee_max_paise', 'entry_fee_notes',
        'accessibility_notes', 'has_parking', 'best_time_to_visit', 'cover_media_id',
        'published_at', 'last_verified_at', 'source_name', 'source_url', 'metadata',
    ];

    protected $attributes = [
        'status' => 'DRAFT',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'is_featured' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
            'is_free' => 'boolean',
            'has_parking' => 'boolean',
            'entry_fee_min_paise' => 'integer',
            'entry_fee_max_paise' => 'integer',
            'rating_avg' => 'float',
            'rating_count' => 'integer',
            'popularity_score' => 'integer',
            'published_at' => 'datetime',
            'last_verified_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function scopePublic(Builder $query): void
    {
        $query->where('status', PublicationStatus::Published->value);
    }

    public function isPublic(): bool
    {
        return $this->status === PublicationStatus::Published;
    }

    public function isDemo(): bool
    {
        return (bool) ($this->metadata['demo'] ?? false);
    }

    public function primaryArea(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'primary_area_id');
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'place_category');
    }

    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(Area::class, 'place_area');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(PlacePhoto::class)->orderBy('sort_order');
    }

    public function approvedPhotos(): HasMany
    {
        return $this->photos()->where('status', PhotoStatus::Approved->value);
    }

    public function facilities(): HasMany
    {
        return $this->hasMany(PlaceFacility::class);
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }
}
