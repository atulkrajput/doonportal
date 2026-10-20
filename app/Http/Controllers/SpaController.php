<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Services\PageRenderer;
use App\Services\Seo\SeoResolver;
use App\Services\SiteSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use stdClass;

/**
 * Serves the React shell for every site path with server-rendered SEO metadata,
 * a real HTTP status (404 for unknown pages and records) and 301s to the
 * canonical URL (lowercase, no trailing slash, one URL per story).
 */
class SpaController extends Controller
{
    public function __invoke(Request $request, SeoResolver $resolver, SiteSettings $settings, PageRenderer $renderer): Response|RedirectResponse
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
        $tracking = array_filter($settings->get('tracking'));
        $tools = $renderer->consentTools();

        return response()->view('app', [
            'seo' => $seo,
            'seoPath' => $path.($query ? "?{$query}" : ''),
            // Verification meta tags only; they set no cookies.
            'verification' => array_intersect_key($tracking, array_flip(['google_site_verification', 'bing_site_verification'])),
            'siteConfig' => [
                'site_name' => $settings->get('seo')['site_name'],
                // Public OAuth client ID for the "Sign in with Google" button; empty hides it.
                'google_client_id' => config('services.google.client_id') ?: null,
                'social' => array_filter($settings->get('social')),
                'footer_pages' => Page::query()->public()->where('show_in_footer', true)
                    ->orderBy('sort_order')->orderBy('title')->get(['slug', 'title'])
                    ->map(fn (Page $p) => ['path' => "/{$p->slug}", 'title' => $p->title])->all(),
                // Third-party tools load in the browser only after consent, and never in the staff area.
                'consent' => [
                    'version' => substr(md5(json_encode(array_map(fn ($c) => array_column($c, 'key'), $tools))), 0, 12),
                    'tools' => $tools,
                ],
                'tracking' => $isAdmin ? new stdClass : array_diff_key($tracking, array_flip(['google_site_verification', 'bing_site_verification'])),
            ],
        ], $seo->status);
    }
}
