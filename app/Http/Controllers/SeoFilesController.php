<?php

namespace App\Http\Controllers;

use App\Enums\StoryType;
use App\Models\Area;
use App\Models\Business;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Place;
use App\Models\SeoMeta;
use App\Models\Story;
use App\Services\Seo\SeoResolver;
use App\Services\SiteSettings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

/**
 * robots.txt and sitemap.xml, generated from live data and SEO settings.
 */
class SeoFilesController extends Controller
{
    public function robots(SiteSettings $settings): Response
    {
        $lines = ['User-agent: *'];

        if ($settings->get('seo')['allow_indexing']) {
            foreach (['/admin', '/api/', '/login', '/register', '/forgot-password', '/reset-password', '/saved', '/search'] as $path) {
                $lines[] = "Disallow: {$path}";
            }
            $lines[] = '';
            $lines[] = 'Sitemap: '.url('/sitemap.xml');
        } else {
            $lines[] = 'Disallow: /';
        }

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    public function sitemap(SiteSettings $settings): Response
    {
        if (! $settings->get('seo')['allow_indexing']) {
            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'."\n";

            return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
        }

        $xml = Cache::remember('seo.sitemap.'.md5(url('/')), now()->addHour(), fn () => $this->buildSitemap());

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    private function buildSitemap(): string
    {
        $urls = [['/', null]];
        foreach (array_keys(SeoResolver::STATIC_PAGES) as $path) {
            $urls[] = [$path, null];
        }

        $hiddenEntities = SeoMeta::query()->where('noindex', true)->whereNotNull('entity_id')->pluck('entity_id')->flip();
        $hiddenPaths = SeoMeta::query()->where('noindex', true)->whereNotNull('path')->pluck('path')->flip();

        $add = function (Builder $query, callable $path) use (&$urls, $hiddenEntities) {
            $query->orderBy('id')->chunk(500, function ($rows) use (&$urls, $path, $hiddenEntities) {
                foreach ($rows as $row) {
                    // Demo records are noindex, so they are never listed.
                    $isDemo = method_exists($row, 'isDemo') && $row->isDemo();
                    if (! $isDemo && ! $hiddenEntities->has($row->id)) {
                        $urls[] = [$path($row), $row->updated_at];
                    }
                }
            });
        };

        $add(Business::query()->public(), fn ($b) => "/business/{$b->slug}");
        $add(Place::query()->public(), fn ($p) => "/place/{$p->slug}");
        $add(Event::query()->public()->upcomingOrLive(), fn ($e) => "/event/{$e->slug}");
        $add(Story::query()->public(), fn ($s) => ($s->type === StoryType::Guide ? '/guide/' : '/story/').$s->slug);
        $add(Collection::query()->public(), fn ($c) => "/collection/{$c->slug}");
        $add(Area::query()->public(), fn ($a) => "/area/{$a->slug}");
        $add(Category::query()->active()->whereIn('type', ['business', 'place']),
            fn ($c) => ($c->type->value === 'business' ? '/businesses/' : '/places/').$c->slug);

        $out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
        $seen = [];
        foreach ($urls as [$path, $updated]) {
            if (isset($seen[$path]) || $hiddenPaths->has($path)) {
                continue;
            }
            $seen[$path] = true;
            $out[] = '  <url><loc>'.e(url($path)).'</loc>'.($updated ? '<lastmod>'.$updated->toAtomString().'</lastmod>' : '').'</url>';
        }
        $out[] = '</urlset>';

        return implode("\n", $out)."\n";
    }
}
