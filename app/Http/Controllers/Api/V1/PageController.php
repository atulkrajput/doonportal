<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\PageRenderer;
use Illuminate\Http\JsonResponse;

/**
 * Published site pages (privacy, terms, about…). Drafts are 404 to the public.
 */
class PageController extends Controller
{
    public function index(): JsonResponse
    {
        $pages = Page::query()->public()->orderBy('sort_order')->orderBy('title')
            ->get(['slug', 'title', 'show_in_footer']);

        return response()->json(['data' => $pages->map(fn (Page $p) => [
            'slug' => $p->slug, 'title' => $p->title, 'path' => "/{$p->slug}", 'show_in_footer' => $p->show_in_footer,
        ])]);
    }

    public function show(string $slug, PageRenderer $renderer): JsonResponse
    {
        $page = Page::query()->public()->where('slug', $slug)->firstOrFail();

        return response()->json(['data' => [
            'slug' => $page->slug,
            'title' => $page->title,
            'summary' => $page->summary,
            'body' => $renderer->render($page),
            'updated_at' => $page->updated_at?->toIso8601String(),
        ]]);
    }
}
