<?php

namespace App\Services\DataEngine;

use App\Services\BusinessImages\SafeUrl;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Finds one candidate image for a discovered business, for staff to approve
 * with the listing. Only sources we may use:
 *  1. a Wikimedia Commons photo linked from OpenStreetMap (free licence, credited);
 *  2. the business's own website's share image (og:image), credited to the site.
 * Never third-party directories, search result pages or image search.
 * Only the address is recorded here; the file is downloaded on approval.
 */
class ImageFinder
{
    private const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

    private const MAX_HTML_BYTES = 800_000;

    public function __construct(private readonly RunLog $log) {}

    /**
     * @param  array{source: string, name: string, data: array<string, mixed>, evidence: array<string, mixed>}  $candidate
     * @return array{url: string, source: string, credit: string, page_url: ?string, license: ?string}|null
     */
    public function find(array $candidate): ?array
    {
        $tags = $candidate['source'] === 'osm' ? (array) ($candidate['evidence']['tags'] ?? []) : [];

        $file = $this->commonsFile($tags['wikimedia_commons'] ?? null) ?? $this->commonsFile($tags['image'] ?? null);
        if ($file && ($image = $this->fromCommons($file))) {
            return $image;
        }

        $website = $candidate['data']['website'] ?? null;
        if ($website && SafeUrl::isFetchable($website)) {
            return $this->fromWebsite($website);
        }

        return null;
    }

    /**
     * "File:Clock Tower.jpg" from a wikimedia_commons tag or a Commons/upload.wikimedia.org URL.
     */
    private function commonsFile(?string $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        if (preg_match('/^File:(.+\.(jpe?g|png|webp))$/i', $value, $m)) {
            return 'File:'.$m[1];
        }
        if (preg_match('#commons\.wikimedia\.org/wiki/(File:[^?\#]+\.(jpe?g|png|webp))#i', $value, $m)) {
            return rawurldecode($m[1]);
        }
        if (preg_match('#upload\.wikimedia\.org/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?\#]+\.(jpe?g|png|webp))#i', $value, $m)) {
            return 'File:'.rawurldecode($m[1]);
        }

        return null;
    }

    /**
     * @return array{url: string, source: string, credit: string, page_url: ?string, license: ?string}|null
     */
    private function fromCommons(string $file): ?array
    {
        try {
            $response = $this->log->call('image', "Wikimedia Commons: {$file}", fn () => Http::timeout(10)
                ->withHeaders(['User-Agent' => config('discovery.user_agent')])
                ->get(self::COMMONS_API, [
                    'action' => 'query', 'format' => 'json', 'prop' => 'imageinfo', 'titles' => $file,
                    'iiprop' => 'url|extmetadata', 'iiurlwidth' => 1200,
                ])->throw());
        } catch (Throwable) {
            return null;
        }

        $info = collect($response->json('query.pages', []))->first()['imageinfo'][0] ?? null;
        $url = $info['thumburl'] ?? $info['url'] ?? null;
        if (! $url || ! SafeUrl::isFetchable($url)) {
            return null;
        }
        $meta = $info['extmetadata'] ?? [];
        $artist = trim(strip_tags((string) ($meta['Artist']['value'] ?? '')));
        $license = trim(strip_tags((string) ($meta['LicenseShortName']['value'] ?? '')));

        return [
            'url' => $url,
            'source' => 'wikimedia',
            'credit' => Str::limit(trim('Photo: '.($artist ?: 'Wikimedia Commons contributor').($license ? ", {$license}" : '').' via Wikimedia Commons'), 240, ''),
            'page_url' => $info['descriptionurl'] ?? null,
            'license' => $license ?: null,
        ];
    }

    /**
     * The website's own share image (og:image / twitter:image).
     *
     * @return array{url: string, source: string, credit: string, page_url: ?string, license: ?string}|null
     */
    private function fromWebsite(string $website): ?array
    {
        $host = (string) parse_url($website, PHP_URL_HOST);
        try {
            $response = $this->log->call('image', "Website {$host}", fn () => Http::timeout(8)
                ->withOptions(SafeUrl::redirectOptions())
                ->withHeaders(['User-Agent' => config('discovery.user_agent'), 'Accept' => 'text/html'])
                ->get($website)->throw());
        } catch (Throwable) {
            return null;
        }

        $html = substr($response->body(), 0, self::MAX_HTML_BYTES);
        $image = null;
        foreach (['og:image:secure_url', 'og:image', 'twitter:image'] as $property) {
            $pattern = '/<meta\s[^>]*(?:property|name)\s*=\s*["\']'.preg_quote($property, '/').'["\'][^>]*>/i';
            if (preg_match($pattern, $html, $tag) && preg_match('/content\s*=\s*["\']([^"\']+)["\']/i', $tag[0], $c)) {
                $image = html_entity_decode(trim($c[1]), ENT_QUOTES | ENT_HTML5);
                break;
            }
        }
        if (! $image) {
            return null;
        }

        $image = $this->absolute($image, $response->effectiveUri()?->__toString() ?? $website);
        if (! $image || ! SafeUrl::isFetchable($image) || preg_match('/\.svg(\?|$)/i', $image)) {
            return null;
        }

        return [
            'url' => $image,
            'source' => 'website',
            'credit' => "Photo: from the business's website ({$host})",
            'page_url' => $website,
            'license' => null,
        ];
    }

    private function absolute(string $url, string $base): ?string
    {
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }
        $scheme = parse_url($base, PHP_URL_SCHEME) ?: 'https';
        $host = parse_url($base, PHP_URL_HOST);
        if (! $host) {
            return null;
        }
        if (str_starts_with($url, '//')) {
            return "{$scheme}:{$url}";
        }
        if (str_starts_with($url, '/')) {
            return "{$scheme}://{$host}{$url}";
        }
        $path = rtrim(dirname((string) (parse_url($base, PHP_URL_PATH) ?: '/')), '/');

        return "{$scheme}://{$host}{$path}/{$url}";
    }
}
