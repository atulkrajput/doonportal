<?php

namespace App\Services\DataEngine;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Web search (https://tavily.com) for the daily discovery. Results are
 * untrusted text: the AI may only extract what they literally say.
 */
class TavilyClient
{
    /**
     * @return list<array{title: string, url: string, content: string}>
     */
    public function search(string $apiKey, string $query, int $max = 8): array
    {
        try {
            $response = Http::timeout(30)->acceptJson()->retry(1, 1000, throw: false)
                ->post(config('discovery.tavily_url'), [
                    'api_key' => $apiKey,
                    'query' => $query,
                    'search_depth' => 'basic',
                    'max_results' => $max,
                    'include_answer' => false,
                    'exclude_domains' => config('discovery.ignored_domains'),
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Web search could not be reached.', previous: $e);
        }

        if ($response->failed()) {
            // The body may echo the request; never log it (it carries the key).
            throw new RuntimeException("Web search failed with HTTP {$response->status()}.");
        }

        $ignored = config('discovery.ignored_domains');

        return collect($response->json('results', []))
            ->filter(fn ($r) => is_array($r) && filter_var($r['url'] ?? null, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', $r['url']))
            ->reject(fn ($r) => collect($ignored)->contains(fn ($d) => str_ends_with(strtolower((string) parse_url($r['url'], PHP_URL_HOST)), $d)))
            ->map(fn ($r) => [
                'title' => mb_substr(strip_tags((string) ($r['title'] ?? '')), 0, 300),
                'url' => (string) $r['url'],
                'content' => mb_substr(strip_tags((string) ($r['content'] ?? '')), 0, 3000),
            ])
            ->values()->all();
    }
}
