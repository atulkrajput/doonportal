<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Area extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'summary', 'description', 'latitude', 'longitude',
        'cover_media_id', 'is_published', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_published' => 'boolean',
        ];
    }

    public function scopePublic(Builder $query): void
    {
        $query->where('is_published', true);
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_area');
    }

    public function places(): BelongsToMany
    {
        return $this->belongsToMany(Place::class, 'place_area');
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
