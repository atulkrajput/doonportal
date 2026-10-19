<?php

namespace App\Models;

use App\Enums\CategoryType;
use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    protected $fillable = [
        'parent_id', 'type', 'name', 'slug', 'description', 'icon', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'type' => CategoryType::class,
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function scopeOfType(Builder $query, CategoryType $type): void
    {
        $query->where('type', $type->value);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order')->orderBy('name');
    }

    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_category');
    }

    public function places(): BelongsToMany
    {
        return $this->belongsToMany(Place::class, 'place_category');
    }

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_categories');
    }

    public function stories(): BelongsToMany
    {
        return $this->belongsToMany(Story::class, 'story_category');
    }

    /**
     * IDs of this category and its direct children (the taxonomy is two levels deep).
     *
     * @return list<string>
     */
    public function selfAndChildIds(): array
    {
        return [$this->id, ...$this->children()->pluck('id')->all()];
    }
}
