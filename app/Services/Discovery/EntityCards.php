<?php

namespace App\Services\Discovery;

use App\Models\Area;
use App\Models\Business;
use App\Models\Event;
use App\Models\Place;
use App\Models\Story;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Collection;

/**
 * Compact, type-tagged cards for mixed lists (search, collections, story links, map).
 */
class EntityCards
{
    /**
     * Eager-load the morph target and its card relations for a set of link rows.
     *
     * @param  Collection<int, Model>  $rows
     */
    public static function loadTargets(Collection $rows, string $relation): void
    {
        $rows->load([$relation => fn (MorphTo $morph) => $morph->morphWith([
            Business::class => ['primaryArea', 'cover'],
            Place::class => ['primaryArea', 'cover'],
            Event::class => ['area', 'venue', 'cover'],
            Story::class => ['cover'],
            Area::class => ['cover'],
        ])]);
    }

    /**
     * Card for a public entity, or null when the entity is missing or not public.
     *
     * @return array<string, mixed>|null
     */
    public static function card(?Model $model): ?array
    {
        if ($model === null) {
            return null;
        }

        if ($model instanceof Area) {
            return $model->is_published ? self::make('area', $model, $model->name, "/area/{$model->slug}", $model->summary, null) : null;
        }

        if (method_exists($model, 'isPublic') && ! $model->isPublic()) {
            return null;
        }

        return match (true) {
            $model instanceof Business => self::make('business', $model, $model->name, "/business/{$model->slug}",
                $model->tagline ?? str($model->description)->limit(140)->value(), $model->primaryArea?->name, [
                    'is_verified' => $model->status->isVerified(),
                    'rating' => ['average' => round($model->rating_avg, 1), 'count' => $model->rating_count],
                    'location' => $model->latitude !== null ? ['lat' => $model->latitude, 'lng' => $model->longitude] : null,
                ]),
            $model instanceof Place => self::make('place', $model, $model->name, "/place/{$model->slug}",
                $model->summary, $model->primaryArea?->name, [
                    'location' => $model->latitude !== null ? ['lat' => $model->latitude, 'lng' => $model->longitude] : null,
                ]),
            $model instanceof Event => self::make('event', $model, $model->title, "/event/{$model->slug}",
                $model->summary, $model->area?->name ?? $model->venue?->name, [
                    'starts_at' => $model->starts_at?->copy()->setTimezone($model->timezone)->toIso8601String(),
                    'phase' => $model->phase(),
                ]),
            $model instanceof Story => self::make('story', $model, $model->title, "/story/{$model->slug}",
                $model->excerpt, null, ['story_type' => $model->type->value]),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private static function make(string $type, Model $model, string $title, string $path, ?string $summary, ?string $area, array $extra = []): array
    {
        $cover = $model->relationLoaded('cover') ? $model->getRelation('cover') : null;

        return [
            'type' => $type,
            'id' => $model->getKey(),
            'slug' => $model->getAttribute('slug'),
            'title' => $title,
            'path' => $path,
            'summary' => $summary,
            'area' => $area,
            'image' => $cover?->url(),
            'is_demo' => (bool) (($model->getAttribute('metadata') ?? [])['demo'] ?? false),
            ...$extra,
        ];
    }
}
