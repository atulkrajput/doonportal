<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security headers for the web and API groups.
 *
 * Pages get a nonce-based Content-Security-Policy (Report-Only unless
 * security.csp.enforce is set). The inline <script type="application/json">
 * and JSON-LD blocks in app.blade.php are data, not script, so CSP does not
 * apply to them; the nonce covers the Vite tags (and @viteReactRefresh in dev).
 * Third-party hosts are the consent-gated trackers in resources/js/lib/consent.js.
 * API responses are JSON and get an enforced deny-all policy.
 */
class SecurityHeaders
{
    private const TRACKER_SCRIPTS = [
        'https://www.googletagmanager.com', // GA4 gtag.js, GTM
        'https://*.clarity.ms',              // Microsoft Clarity (www., scripts.)
        'https://connect.facebook.net',      // Meta Pixel
    ];

    private const TRACKER_CONNECT = [
        'https://*.google-analytics.com',
        'https://*.analytics.google.com',
        'https://*.googletagmanager.com',
        'https://*.g.doubleclick.net',
        'https://www.google.com',
        'https://*.clarity.ms',
        'https://www.facebook.com',
        'https://connect.facebook.net',
    ];

    /** Sign in with Google (Google Identity Services): script, button iframe and its styles. */
    private const GOOGLE_SIGN_IN = 'https://accounts.google.com/gsi/';

    private const TRACKER_FRAMES = [
        'https://www.googletagmanager.com', // GTM preview mode
        'https://td.doubleclick.net',       // GA4 / Ads conversion frame
        'https://www.facebook.com',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $isApi = $request->is('api/*');
        $nonce = $isApi ? null : Vite::useCspNonce();

        $response = $next($request);
        $headers = $response->headers;

        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()');

        if ($request->isSecure() || app()->isProduction()) {
            $hsts = 'max-age='.config('security.hsts.max_age');
            $headers->set('Strict-Transport-Security', config('security.hsts.include_subdomains') ? "{$hsts}; includeSubDomains" : $hsts);
        }

        if ($isApi) {
            $headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        } else {
            $name = config('security.csp.enforce') ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
            $headers->set($name, $this->pagePolicy($nonce));
        }

        return $response;
    }

    private function pagePolicy(string $nonce): string
    {
        $dev = $this->viteDevServer();

        $directives = [
            'default-src' => ["'self'"],
            'base-uri' => ["'self'"],
            'object-src' => ["'none'"],
            'frame-ancestors' => ["'none'"],
            'form-action' => ["'self'"],
            'script-src' => ["'self'", "'nonce-{$nonce}'", ...$dev, ...self::TRACKER_SCRIPTS, self::GOOGLE_SIGN_IN.'client'],
            // Inline styles: the noscript fallback, React style props and Vite's dev CSS injection.
            'style-src' => ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', ...$dev, self::GOOGLE_SIGN_IN.'style'],
            'font-src' => ["'self'", 'data:', 'https://fonts.gstatic.com', ...$dev],
            // Media may be served from an external disk/CDN; tracker pixels are images too.
            'img-src' => ["'self'", 'data:', 'blob:', 'https:', ...$dev],
            'connect-src' => ["'self'", ...$dev, ...array_map(fn ($o) => preg_replace('#^http#', 'ws', $o), $dev), ...self::TRACKER_CONNECT, self::GOOGLE_SIGN_IN],
            'frame-src' => ["'self'", ...self::TRACKER_FRAMES, self::GOOGLE_SIGN_IN],
            'worker-src' => ["'self'", 'blob:'],
            'manifest-src' => ["'self'"],
        ];

        if ($reportUri = config('security.csp.report_uri')) {
            $directives['report-uri'] = [$reportUri];
        }

        return implode('; ', array_map(
            fn (string $name, array $sources) => $name.' '.implode(' ', array_unique($sources)),
            array_keys($directives),
            $directives,
        ));
    }

    /** @return list<string> The Vite dev server origin while `npm run dev` is running. */
    private function viteDevServer(): array
    {
        if (! Vite::isRunningHot()) {
            return [];
        }

        $url = trim((string) file_get_contents(Vite::hotFile()));
        $parts = parse_url($url);

        return isset($parts['scheme'], $parts['host'])
            ? [$parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '')]
            : [];
    }
}
