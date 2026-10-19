<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Content Security Policy
    |--------------------------------------------------------------------------
    |
    | Sent by App\Http\Middleware\SecurityHeaders. The policy ships as
    | Content-Security-Policy-Report-Only until the browser console (or the
    | report endpoint) shows no violations; set CSP_ENFORCE=true to enforce it.
    |
    */

    'csp' => [
        'enforce' => (bool) env('CSP_ENFORCE', false),
        'report_uri' => env('CSP_REPORT_URI'),
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP Strict Transport Security
    |--------------------------------------------------------------------------
    |
    | Sent on HTTPS requests and in production. includeSubDomains stays off
    | until every subdomain of the site is known to serve HTTPS.
    |
    */

    'hsts' => [
        'max_age' => (int) env('HSTS_MAX_AGE', 31536000),
        'include_subdomains' => (bool) env('HSTS_INCLUDE_SUBDOMAINS', false),
    ],

];
