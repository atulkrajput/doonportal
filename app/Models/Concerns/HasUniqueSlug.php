<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Generates a unique slug from the model's name/title on create and routes by slug.
 * Models may override slugSource() to pick a different source column.
 */
trait HasUniqueSlug
{
    public static function bootHasUniqueSlug(): void
    {
        static::creating(function ($model) {
            if (blank($model->slug)) {
                $model->slug = $model->generateUniqueSlug((string) $model->{$model->slugSource()});
            }
        });
    }

    public function slugSource(): string
    {
        return 'name';
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function generateUniqueSlug(string $source): string
    {
        $base = Str::slug($source) ?: Str::lower((string) Str::ulid());
        $base = Str::limit($base, 180, '');
        $slug = $base;
        $i = 2;

        while (static::withoutGlobalScopes()->where('slug', $slug)
            ->when(method_exists($this, 'trashed'), fn ($q) => $q->withTrashed())
            ->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
