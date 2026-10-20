<!DOCTYPE html>
<html lang="en-IN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#1b3461">
    {{-- CSP nonce (App\Http\Middleware\SecurityHeaders): read by Vite's dev client and resources/js/lib/consent.js. --}}
    <meta property="csp-nonce" nonce="{{ Vite::cspNonce() }}">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">

    {{-- SEO: resolved server-side by App\Services\Seo\SeoResolver; the SPA keeps it in sync on navigation. --}}
    <title>{{ $seo->title }}</title>
    <meta name="description" content="{{ $seo->description }}">
    <meta name="robots" content="{{ $seo->robots }}">
    <link rel="canonical" href="{{ $seo->canonical }}">
    <meta name="dp-seo-path" content="{{ $seoPath }}">
    <meta property="og:site_name" content="{{ $seo->siteName }}">
    <meta property="og:locale" content="en_IN">
    <meta property="og:type" content="{{ $seo->type }}">
    <meta property="og:title" content="{{ $seo->title }}">
    <meta property="og:description" content="{{ $seo->description }}">
    <meta property="og:url" content="{{ $seo->canonical }}">
    @if ($seo->image)
        <meta property="og:image" content="{{ $seo->image }}">
        <meta name="twitter:image" content="{{ $seo->image }}">
    @endif
    <meta name="twitter:card" content="{{ $seo->image ? 'summary_large_image' : 'summary' }}">
    <meta name="twitter:title" content="{{ $seo->title }}">
    <meta name="twitter:description" content="{{ $seo->description }}">
    @if ($seo->twitterHandle)
        <meta name="twitter:site" content="{{ $seo->twitterHandle }}">
    @endif
    @if ($ld = $seo->jsonLdScript())
        <script type="application/ld+json" id="page-jsonld">{!! $ld !!}</script>
    @endif

    {{-- Search engine verification (IDs validated by SiteSettings::rules()). Third-party trackers are
         loaded by resources/js/lib/consent.js only after the visitor consents. --}}
    @if (! empty($verification['google_site_verification']))
        <meta name="google-site-verification" content="{{ $verification['google_site_verification'] }}">
    @endif
    @if (! empty($verification['bing_site_verification']))
        <meta name="msvalidate.01" content="{{ $verification['bing_site_verification'] }}">
    @endif

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Oswald:wght@500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script type="application/json" id="site-config">{!! json_encode($siteConfig, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES) !!}</script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body>
    <div id="app"></div>
    <noscript>
        <p style="padding:16px;font-family:sans-serif">DoonPortal needs JavaScript enabled to run.</p>
    </noscript>
</body>
</html>
