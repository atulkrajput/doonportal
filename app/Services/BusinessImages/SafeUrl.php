<?php

namespace App\Services\BusinessImages;

/**
 * Guards server-side fetches of URLs that come from outside (OpenStreetMap,
 * business websites, search results): only public http(s) hosts, never
 * localhost or private/reserved networks (no SSRF into our own server).
 */
class SafeUrl
{
    /** Host name → IPv4 list; replaceable in tests so they don't depend on DNS. */
    public static ?\Closure $resolver = null;

    public static function isFetchable(?string $url): bool
    {
        if (! is_string($url) || ! preg_match('#^https?://#i', $url) || mb_strlen($url) > 2048 || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $host = parse_url($url, PHP_URL_HOST);
        $port = parse_url($url, PHP_URL_PORT);
        if (! $host || ($port !== null && ! in_array($port, [80, 443], true)) || parse_url($url, PHP_URL_USER) !== null) {
            return false;
        }

        $host = trim($host, '[]');
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : ((self::$resolver ?? fn ($h) => gethostbynamel($h))($host) ?: []);
        if ($ips === []) {
            return false;
        }

        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Guzzle options: follow at most 3 redirects, each to a fetchable address.
     *
     * @return array<string, mixed>
     */
    public static function redirectOptions(): array
    {
        return ['allow_redirects' => [
            'max' => 3,
            'protocols' => ['http', 'https'],
            'on_redirect' => function ($request, $response, $uri) {
                if (! self::isFetchable((string) $uri)) {
                    throw new \RuntimeException('Redirected to an address that is not allowed.');
                }
            },
        ]];
    }
}
