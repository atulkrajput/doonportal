<!DOCTYPE html>
<html lang="en-IN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#1b4d33">
    <title>DoonPortal — All Things Doon</title>
    <meta name="description" content="Discover. Connect. Belong. Businesses, places, events and stories from Dehradun.">
    <link rel="canonical" href="{{ url()->current() }}">
    <meta property="og:site_name" content="DoonPortal">
    <meta property="og:title" content="DoonPortal — All Things Doon">
    <meta property="og:type" content="website">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
