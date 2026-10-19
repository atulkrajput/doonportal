<?php

namespace App\Http\Controllers;

use App\Services\Seo\SeoResolver;
use App\Services\SiteSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Serves the React shell for every site path with server-rendered SEO metadata,
 * a real HTTP status (404 for unknown pages and records) and 301s to the
 * canonical URL (lowercase, no trailing slash, one URL per story).
 */
class SpaController extends Controller
{
    public function __invoke(Request $request, SeoResolver $resolver, SiteSettings $settings): Response|RedirectResponse
    {
        $path = $request->getPathInfo();
        $canonicalPath = strtolower(rtrim($path, '/')) ?: '/';
        $query = $request->getQueryString();

        if ($canonicalPath !== $path) {
            return redirect()->to($canonicalPath.($query ? "?{$query}" : ''), 301);
        }

        $seo = $resolver->resolve($path, $request->query());

        if ($seo->redirect) {
            return redirect()->to($seo->redirect.($query ? "?{$query}" : ''), 301);
        }

        $isAdmin = $path === '/admin' || str_starts_with($path, '/admin/');

        return response()->view('app', [
            'seo' => $seo,
            'seoPath' => $path.($query ? "?{$query}" : ''),
            // Third-party tracking never loads inside the staff area.
            'tracking' => $isAdmin ? [] : array_filter($settings->get('tracking')),
            'siteConfig' => [
                'site_name' => $settings->get('seo')['site_name'],
                'social' => array_filter($settings->get('social')),
            ],
        ], $seo->status);
    }
}
