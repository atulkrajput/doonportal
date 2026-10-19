<?php

namespace App\Services\Search;

use App\Services\Discovery\DiscoveryQuery;
use App\Services\Discovery\EntityCards;

class DatabaseSearchService implements SearchService
{
    public function __construct(private readonly DiscoveryQuery $discovery) {}

    public function search(string $term, array $types, int $limitPerType): array
    {
        $filters = ['q' => $term];
        $results = [];

        foreach (array_intersect(self::TYPES, $types) as $type) {
            $query = match ($type) {
                'business' => $this->discovery->businesses($filters),
                'place' => $this->discovery->places($filters),
                'event' => $this->discovery->events($filters),
                'story' => $this->discovery->stories($filters),
            };

            $results[$type] = $query->limit($limitPerType)->get()
                ->map(fn ($model) => EntityCards::card($model))
                ->filter()
                ->values()
                ->all();
        }

        return $results;
    }
}
