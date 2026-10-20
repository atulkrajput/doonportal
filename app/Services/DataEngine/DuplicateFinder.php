<?php

namespace App\Services\DataEngine;

use App\Models\AiDiscovery;
use App\Models\Business;
use Illuminate\Support\Str;

/**
 * Is a found business already on DoonPortal (or already in the review queue)?
 * Same phone number, or a very similar name close by, counts as the same place.
 */
class DuplicateFinder
{
    private const NEARBY_METRES = 250;

    /** Words that differ between listings of the same place. */
    private const NOISE = ['the', 'and', 'pvt', 'ltd', 'private', 'limited', 'dehradun', 'doon', 'shop', 'store', 'centre', 'center', 'restaurant', 'cafe'];

    /** @var array<string, list<array{id: string, key: string, lat: ?float, lng: ?float, phone: ?string}>>|null */
    private ?array $index = null;

    /**
     * @param  array{name: string, latitude?: ?float, longitude?: ?float, phone?: ?string}  $candidate
     */
    public function existingBusiness(array $candidate): ?string
    {
        $key = $this->key($candidate['name']);
        $phone = $this->phoneKey($candidate['phone'] ?? null);

        foreach ($this->index() as $rows) {
            foreach ($rows as $row) {
                if ($phone !== null && $row['phone'] === $phone) {
                    return $row['id'];
                }
                if (! $this->similar($key, $row['key'])) {
                    continue;
                }
                $lat = $candidate['latitude'] ?? null;
                $lng = $candidate['longitude'] ?? null;
                // Same name with no location on one side: treat as the same place rather than risk a duplicate.
                if ($lat === null || $row['lat'] === null || $this->metres($lat, $lng, $row['lat'], $row['lng']) <= self::NEARBY_METRES) {
                    return $row['id'];
                }
            }
        }

        return null;
    }

    /**
     * A web result for a name already queued (from any source) in the last pass.
     */
    public function alreadyQueued(string $name): bool
    {
        $key = $this->key($name);

        return AiDiscovery::query()->whereIn('status', [AiDiscovery::PENDING, AiDiscovery::APPROVED])
            ->pluck('name')->contains(fn ($n) => $this->similar($key, $this->key($n)));
    }

    /**
     * Remember a newly queued candidate so later categories in the same run see it.
     *
     * @param  array{name: string, latitude?: ?float, longitude?: ?float, phone?: ?string}  $candidate
     */
    public function remember(string $id, array $candidate): void
    {
        $this->index();
        $this->index['queued'][] = [
            'id' => $id,
            'key' => $this->key($candidate['name']),
            'lat' => $candidate['latitude'] ?? null,
            'lng' => $candidate['longitude'] ?? null,
            'phone' => $this->phoneKey($candidate['phone'] ?? null),
        ];
    }

    public function key(string $name): string
    {
        $words = collect(preg_split('/[^a-z0-9]+/', Str::ascii(mb_strtolower($name))))
            ->filter(fn ($w) => $w !== '' && ! in_array($w, self::NOISE, true));

        return $words->implode(' ');
    }

    private function similar(string $a, string $b): bool
    {
        if ($a === '' || $b === '') {
            return false;
        }
        if ($a === $b) {
            return true;
        }
        similar_text($a, $b, $percent);

        return $percent >= 88;
    }

    private function phoneKey(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        return strlen($digits) >= 10 ? substr($digits, -10) : null;
    }

    private function metres(float $lat1, ?float $lng1, float $lat2, ?float $lng2): float
    {
        if ($lng1 === null || $lng2 === null) {
            return 0;
        }
        $r = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $h = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $r * asin(min(1, sqrt($h)));
    }

    /**
     * @return array<string, list<array{id: string, key: string, lat: ?float, lng: ?float, phone: ?string}>>
     */
    private function index(): array
    {
        if ($this->index !== null) {
            return $this->index;
        }

        $rows = [];
        Business::withTrashed()->select(['id', 'name', 'latitude', 'longitude', 'phone'])->orderBy('id')
            ->chunk(1000, function ($chunk) use (&$rows) {
                foreach ($chunk as $b) {
                    $rows[] = ['id' => $b->id, 'key' => $this->key($b->name), 'lat' => $b->latitude, 'lng' => $b->longitude, 'phone' => $this->phoneKey($b->phone)];
                }
            });

        return $this->index = ['businesses' => $rows, 'queued' => []];
    }
}
