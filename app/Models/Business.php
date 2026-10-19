<?php

namespace App\Models;

use App\Enums\BusinessStatus;
use App\Enums\PhotoStatus;
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

class Business extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    /**
     * status, verified_at, owner_id and rating aggregates are deliberately not
     * fillable: they change only through domain services.
     */
    protected $fillable = [
        'name', 'slug', 'tagline', 'description', 'is_published', 'is_featured',
        'address_line', 'locality', 'city', 'pincode', 'primary_area_id', 'latitude', 'longitude',
        'phone', 'whatsapp', 'email', 'website', 'price_range', 'amenities', 'payment_methods',
        'logo_media_id', 'cover_media_id', 'opened_on', 'last_verified_at', 'source_name', 'source_url', 'metadata',
    ];

    protected $attributes = [
        'status' => 'UNVERIFIED',
    ];

    protected function casts(): array
    {
        return [
            'status' => BusinessStatus::class,
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
            'price_range' => 'integer',
            'amenities' => 'array',
            'payment_methods' => 'array',
            'rating_avg' => 'float',
            'rating_count' => 'integer',
            'popularity_score' => 'integer',
            'opened_on' => 'date',
            'verified_at' => 'datetime',
            'last_verified_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Listings visible on the public site.
     */
    public function scopePublic(Builder $query): void
    {
        $query->where('is_published', true)
            ->where('status', '!=', BusinessStatus::Suspended->value);
    }

    public function isPublic(): bool
    {
        return $this->is_published && $this->status !== BusinessStatus::Suspended;
    }

    public function isDemo(): bool
    {
        return (bool) ($this->metadata['demo'] ?? false);
    }

    public function primaryArea(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'primary_area_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function logo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'logo_media_id');
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'business_category')->withPivot('is_primary');
    }

    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(Area::class, 'business_area');
    }

    public function services(): HasMany
    {
        return $this->hasMany(BusinessService::class)->orderBy('sort_order');
    }

    public function hours(): HasMany
    {
        return $this->hasMany(BusinessHour::class)->orderBy('day_of_week')->orderBy('opens_at');
    }

    public function hourExceptions(): HasMany
    {
        return $this->hasMany(BusinessHourException::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(BusinessPhoto::class)->orderBy('sort_order');
    }

    public function approvedPhotos(): HasMany
    {
        return $this->photos()->where('status', PhotoStatus::Approved->value);
    }

    public function socialLinks(): HasMany
    {
        return $this->hasMany(BusinessSocialLink::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(BusinessClaim::class);
    }

    public function organizers(): BelongsToMany
    {
        return $this->belongsToMany(Organizer::class, 'organizer_business');
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
