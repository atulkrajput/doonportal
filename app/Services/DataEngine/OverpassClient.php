<?php

namespace App\Services\DataEngine;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Reads named places from OpenStreetMap through the Overpass API. The public
 * servers are shared and often busy, so a run asks once for every category
 * and falls back to mirrors. Data © OpenStreetMap contributors (ODbL):
 * listings built from it credit OSM.
 */
class OverpassClient
{
    /**
     * Named elements carrying any of the tags, inside the bounding box.
     *
     * @param  list<string>  $tags  "key=value"
     * @param  array{0: float, 1: float, 2: float, 3: float}  $bbox  south, west, north, east
     * @return list<array{type: string, id: int, lat: ?float, lon: ?float, tags: array<string, string>}>
     */
    public function find(array $tags, array $bbox, int $max = 5000): array
    {
        $tags = array_values(array_unique($tags));
        if ($tags === []) {
            return [];
        }

        $box = implode(',', array_map(fn ($v) => (float) $v, $bbox));
        $clauses = collect($tags)->map(function (string $tag) use ($box) {
            [$key, $value] = array_pad(explode('=', $tag, 2), 2, null);
            if (! preg_match('/^[a-z_:]+$/', $key) || ! preg_match('/^[a-z_]+$/', (string) $value)) {
                throw new RuntimeException("Invalid OpenStreetMap tag [{$tag}] in config/discovery.php.");
            }

            return "nwr[\"{$key}\"=\"{$value}\"][\"name\"]({$box});";
        })->implode("\n");

        $query = "[out:json][timeout:180];\n(\n{$clauses}\n);\nout center tags {$max};";
        $response = $this->post($query);

        return collect($response['elements'] ?? [])
            ->filter(fn ($e) => is_array($e) && filled($e['tags']['name'] ?? null))
            ->map(fn (array $e) => [
                'type' => (string) $e['type'],
                'id' => (int) $e['id'],
                'lat' => isset($e['lat']) ? (float) $e['lat'] : (isset($e['center']['lat']) ? (float) $e['center']['lat'] : null),
                'lon' => isset($e['lon']) ? (float) $e['lon'] : (isset($e['center']['lon']) ? (float) $e['center']['lon'] : null),
                'tags' => array_map('strval', $e['tags']),
            ])
            ->values()->all();
    }

    /**
     * Does an element carry one of these "key=value" tags?
     *
     * @param  array{tags: array<string, string>}  $element
     * @param  list<string>  $tags
     */
    public static function matches(array $element, array $tags): bool
    {
        foreach ($tags as $tag) {
            [$key, $value] = array_pad(explode('=', $tag, 2), 2, null);
            if (($element['tags'][$key] ?? null) === $value) {
                return true;
            }
        }

        return false;
    }

    /**
     * Try each server in turn, pausing before the next when one is busy.
     *
     * @return array<string, mixed>
     */
    private function post(string $query): array
    {
        $errors = [];
        foreach ((array) config('discovery.overpass_urls') as $i => $url) {
            if ($i > 0) {
                usleep((int) config('discovery.pause_ms') * 1000 * 4);
            }
            try {
                $response = Http::timeout(200)
                    ->withHeaders(['User-Agent' => config('discovery.user_agent')])
                    ->asForm()
                    ->post($url, ['data' => $query]);
            } catch (ConnectionException $e) {
                $errors[] = parse_url($url, PHP_URL_HOST).': no response';

                continue;
            }

            $json = $response->successful() ? $response->json() : null;
            if (is_array($json) && array_key_exists('elements', $json)) {
                return $json;
            }
            $errors[] = parse_url($url, PHP_URL_HOST).": HTTP {$response->status()}";
        }

        throw new RuntimeException('OpenStreetMap servers are busy ('.implode('; ', $errors).').');
    }
}
