<?php

namespace App\Services\Search;

/**
 * Search provider abstraction. The default implementation queries the primary
 * database; a dedicated engine (PostgreSQL FTS, Meilisearch) can replace it later.
 */
interface SearchService
{
    public const TYPES = ['business', 'place', 'event', 'story'];

    /**
     * @param  list<string>  $types  subset of self::TYPES
     * @return array<string, list<array<string, mixed>>> entity cards grouped by type
     */
    public function search(string $term, array $types, int $limitPerType): array;
}
