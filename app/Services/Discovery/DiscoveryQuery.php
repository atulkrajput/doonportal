<?php

namespace App\Services\Discovery;

use App\Enums\BusinessStatus;
use App\Enums\CategoryType;
use App\Models\Area;
use App\Models\Business;
use App\Models\Category;
use App\Models\Event;
use App\Models\Place;
use App\Models\Story;
use App\Services\OpeningHours;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Builds public listing queries from validated filters. Only public records are
 * ever returned; sorting uses fixed allowlisted clauses.
 */
class DiscoveryQuery
{
    public const BUSINESS_CARD_RELATIONS = ['primaryArea', 'categories', 'cover', 'logo', 'hours', 'hourExceptions'];

    public const PLACE_CARD_RELATIONS = ['primaryArea', 'categories', 'cover'];

    public const EVENT_CARD_RELATIONS = ['venue', 'area', 'organizer', 'categories', 'cover'];

    public const STORY_CARD_RELATIONS = ['author', 'cover', 'categories'];

    /** How recent a listing must be to count as "New in Doon". */
    public const NEW_DAYS = 90;

    /**
     * @param  array<string, mixed>  $f
     */
    public function businesses(array $f = [], string $sort = 'popular'): Builder
    {
        $query = Business::query()->public()->with(self::BUSINESS_CARD_RELATIONS);

        $this->applyText($query, $f['q'] ?? null, ['name', 'tagline', 'description', 'locality']);

        if (! empty($f['category'])) {
            $ids = $this->categoryIds($f['category'], CategoryType::Business);
            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $ids));
        }

        if (! empty($f['area'])) {
            $this->applyArea($query, $f['area']);
        }

        if (! empty($f['price'])) {
            $query->whereIn('price_range', array_map('intval', (array) $f['price']));
        }

        if (isset($f['min_rating'])) {
            $query->where('rating_avg', '>=', (float) $f['min_rating']);
        }

        if (! empty($f['open_now'])) {
            OpeningHours::scopeOpenAt($query);
        }

        if (! empty($f['verified'])) {
            $query->whereIn('status', [BusinessStatus::Verified->value, BusinessStatus::Claimed->value]);
        }

        if (! empty($f['new'])) {
            $this->applyNew($query);
        }

        match ($sort) {
            'rating' => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'),
            'newest' => $query->orderByDesc('created_at'),
            'name' => $query->orderBy('name'),
            default => $query->orderByDesc('is_featured')->orderByDesc('popularity_score')->orderByDesc('rating_avg'),
        };

        return $query->orderBy('id');
    }

    /**
     * @param  array<string, mixed>  $f
     */
    public function places(array $f = [], string $sort = 'popular'): Builder
    {
        $query = Place::query()->public()->with(self::PLACE_CARD_RELATIONS);

        $this->applyText($query, $f['q'] ?? null, ['name', 'summary', 'description']);

        if (! empty($f['category'])) {
            $ids = $this->categoryIds($f['category'], CategoryType::Place);
            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $ids));
        }

        if (! empty($f['area'])) {
            $this->applyArea($query, $f['area']);
        }

        if (isset($f['free'])) {
            $query->where('is_free', (bool) $f['free']);
        }

        match ($sort) {
            'rating' => $query->orderByDesc('rating_avg'),
            'newest' => $query->orderByDesc('published_at'),
            'name' => $query->orderBy('name'),
            default => $query->orderByDesc('is_featured')->orderByDesc('popularity_score'),
        };

        return $query->orderBy('id');
    }

    /**
     * @param  array<string, mixed>  $f
     */
    public function events(array $f = [], string $sort = 'soonest'): Builder
    {
        $query = Event::query()->public()->with(self::EVENT_CARD_RELATIONS);

        $this->applyText($query, $f['q'] ?? null, ['title', 'summary', 'description']);

        if (! empty($f['category'])) {
            $ids = $this->categoryIds($f['category'], CategoryType::Event);
            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $ids));
        }

        if (! empty($f['area'])) {
            $area = Area::query()->public()->where('slug', $f['area'])->first();
            $area
                ? $query->where(fn ($q) => $q->where('area_id', $area->id)
                    ->orWhereHas('venue', fn ($v) => $v->where('area_id', $area->id)))
                : $query->whereRaw('1 = 0');
        }

        if (isset($f['free'])) {
            $query->where('is_free', (bool) $f['free']);
        }

        [$from, $to] = $this->dateWindow($f);
        if ($from) {
            // Overlaps the window: still running at its start, using the same assumed
            // duration for open-ended events as the default listing and Event::phase().
            $query->upcomingOrLive($from);
        } elseif (empty($f['include_past'])) {
            $query->upcomingOrLive();
        }
        if ($to) {
            $query->where('starts_at', '<=', $to);
        }

        $sort === 'newest'
            ? $query->orderByDesc('published_at')
            : $query->orderBy('starts_at');

        return $query->orderBy('id');
    }

    /**
     * @param  array<string, mixed>  $f
     */
    public function stories(array $f = [], string $sort = 'newest'): Builder
    {
        $query = Story::query()->public()->with(self::STORY_CARD_RELATIONS);

        $this->applyText($query, $f['q'] ?? null, ['title', 'excerpt']);

        if (! empty($f['category'])) {
            $ids = $this->categoryIds($f['category'], CategoryType::Story);
            $query->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $ids));
        }

        if (! empty($f['type'])) {
            $query->where('type', $f['type']);
        }

        $sort === 'oldest' ? $query->orderBy('published_at') : $query->orderByDesc('published_at');

        return $query->orderBy('id');
    }

    public function applyNew(Builder $query): void
    {
        $since = now()->subDays(self::NEW_DAYS);
        $query->where(fn ($q) => $q->where('opened_on', '>=', $since->toDateString())
            ->orWhere(fn ($q) => $q->whereNull('opened_on')->where('created_at', '>=', $since)));
    }

    /**
     * Case-insensitive substring match, portable across MySQL, PostgreSQL and SQLite.
     *
     * @param  list<string>  $columns
     */
    public function applyText(Builder $query, ?string $term, array $columns): void
    {
        $term = trim((string) $term);
        if ($term === '') {
            return;
        }

        // "!" is the LIKE escape character: a backslash literal is not portable to MySQL.
        $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($term)).'%';
        $query->where(function ($q) use ($columns, $like) {
            foreach ($columns as $column) {
                $q->orWhereRaw("LOWER({$column}) LIKE ? ESCAPE '!'", [$like]);
            }
        });
    }

    private function applyArea(Builder $query, string $slug): void
    {
        $area = Area::query()->public()->where('slug', $slug)->first();

        if (! $area) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where(fn ($q) => $q->where('primary_area_id', $area->id)
            ->orWhereHas('areas', fn ($a) => $a->where('areas.id', $area->id)));
    }

    /**
     * The category and its children, or nothing (empty result) for an unknown slug.
     *
     * @return list<string>
     */
    private function categoryIds(string $slug, CategoryType $type): array
    {
        $category = Category::query()->active()->ofType($type)->where('slug', $slug)->first();

        return $category ? $category->selfAndChildIds() : ['__none__'];
    }

    /**
     * @param  array<string, mixed>  $f
     * @return array{0: ?CarbonImmutable, 1: ?CarbonImmutable} UTC bounds
     */
    private function dateWindow(array $f): array
    {
        $tz = OpeningHours::TIMEZONE;
        $now = CarbonImmutable::now($tz);

        [$from, $to] = match ($f['when'] ?? null) {
            'today' => [$now, $now->endOfDay()],
            'tomorrow' => [$now->addDay()->startOfDay(), $now->addDay()->endOfDay()],
            'weekend' => $now->isWeekend()
                ? [$now, $now->endOfWeek(CarbonImmutable::SUNDAY)]
                : [$now->next(CarbonImmutable::SATURDAY)->startOfDay(), $now->next(CarbonImmutable::SUNDAY)->endOfDay()],
            'week' => [$now, $now->addDays(7)->endOfDay()],
            'month' => [$now, $now->addDays(30)->endOfDay()],
            default => [
                isset($f['from']) ? CarbonImmutable::parse($f['from'], $tz)->startOfDay() : null,
                isset($f['to']) ? CarbonImmutable::parse($f['to'], $tz)->endOfDay() : null,
            ],
        };

        return [$from?->utc(), $to?->utc()];
    }
}
