<!DOCTYPE html>
<html lang="en-IN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#1b3461">
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

    {{-- Search engine verification and tracking: IDs only, validated by SiteSettings::rules(). --}}
    @if (! empty($tracking['google_site_verification']))
        <meta name="google-site-verification" content="{{ $tracking['google_site_verification'] }}">
    @endif
    @if (! empty($tracking['bing_site_verification']))
        <meta name="msvalidate.01" content="{{ $tracking['bing_site_verification'] }}">
    @endif
    @if (! empty($tracking['gtm_container_id']))
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',@json($tracking['gtm_container_id']));</script>
    @endif
    @if (! empty($tracking['ga4_measurement_id']))
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $tracking['ga4_measurement_id'] }}"></script>
        <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',@json($tracking['ga4_measurement_id']));</script>
    @endif
    @if (! empty($tracking['meta_pixel_id']))
        <script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',@json($tracking['meta_pixel_id']));fbq('track','PageView');</script>
    @endif
    @if (! empty($tracking['clarity_project_id']))
        <script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",@json($tracking['clarity_project_id']));</script>
    @endif

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Oswald:wght@500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script type="application/json" id="site-config">{!! json_encode($siteConfig, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES) !!}</script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.jsx'])
</head>
<body>
    @if (! empty($tracking['gtm_container_id']))
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $tracking['gtm_container_id'] }}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    @endif
    <div id="app"></div>
    <noscript>
        <p style="padding:16px;font-family:sans-serif">DoonPortal needs JavaScript enabled to run.</p>
    </noscript>
</body>
</html>
