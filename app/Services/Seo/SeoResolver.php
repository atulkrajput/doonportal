<?php

namespace App\Services\Seo;

use App\Enums\CategoryType;
use App\Enums\StoryType;
use App\Models\Area;
use App\Models\Business;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Media;
use App\Models\Place;
use App\Models\SeoMeta;
use App\Models\Story;
use App\Services\SiteSettings;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Builds title, description, canonical URL, robots, Open Graph and JSON-LD for
 * any public site path. Used by the server-rendered SPA shell (so crawlers see
 * real metadata and real 404s) and by GET /api/v1/seo for client navigation.
 *
 * Structured data uses only fields we hold. Demo records are never indexed and
 * get no structured data.
 */
class SeoResolver
{
    /** Static pages: path => [title, description, robots, breadcrumb label]. */
    public const STATIC_PAGES = [
        '/businesses' => ['Businesses in Dehradun', 'Local shops, restaurants, services and more across Dehradun — with opening hours, areas and contact details.'],
        '/places' => ['Things to do in Dehradun', 'Waterfalls, viewpoints, heritage sites, temples and places to explore in and around Dehradun.'],
        '/events' => ['Events in Dehradun', 'Concerts, workshops, markets and community events happening in Doon.'],
        '/stories' => ['Doon Stories', 'Guides, heritage features, interviews and local stories from Dehradun.'],
        '/collections' => ['Best of Doon', 'Curated lists of Dehradun’s best cafes, restaurants, places and more.'],
        '/areas' => ['Areas of Dehradun', 'Explore Dehradun neighbourhood by neighbourhood.'],
        '/explore' => ['All categories', 'Browse every category of businesses and places in Dehradun.'],
        '/services' => ['Services in Dehradun', 'Home, professional, lifestyle, automotive, education and healthcare services in Dehradun.'],
        '/business-portal' => ['List your business', 'Add or claim your Dehradun business on DoonPortal — free.'],
        '/about' => ['About DoonPortal', 'DoonPortal is a local guide to Dehradun’s businesses, places, events and stories.'],
        '/privacy' => ['Privacy policy', 'How DoonPortal collects, uses and protects your information.'],
        '/terms' => ['Terms of use', 'The terms for using DoonPortal.'],
    ];

    /** Utility pages that must never be indexed. */
    public const PRIVATE_PAGES = [
        '/login' => 'Sign in',
        '/register' => 'Create account',
        '/forgot-password' => 'Reset password',
        '/reset-password' => 'Choose a new password',
        '/saved' => 'My DoonPortal',
    ];

    private array $seo;

    private array $social;

    public function __construct(private readonly SiteSettings $settings) {}

    /**
     * @param  array<string, mixed>  $query
     */
    public function resolve(string $path, array $query = []): SeoPage
    {
        $this->seo = $this->settings->get('seo');
        $this->social = $this->settings->get('social');
        $path = '/'.trim($path, '/');

        $page = $this->route($path, $query);

        if (! $this->seo['allow_indexing'] && $page->status === 200) {
            $page->robots = 'noindex,nofollow';
        }

        return $page;
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function route(string $path, array $query): SeoPage
    {
        if ($path === '/') {
            return $this->home();
        }
        if ($path === '/admin' || str_starts_with($path, '/admin/')) {
            return $this->page('Admin', $this->seo['default_description'], $path, robots: 'noindex,nofollow');
        }
        if (isset(self::PRIVATE_PAGES[$path])) {
            return $this->page(self::PRIVATE_PAGES[$path], $this->seo['default_description'], $path, robots: 'noindex,follow');
        }
        if ($path === '/search') {
            $q = Str::limit(trim((string) ($query['q'] ?? '')), 60, '');

            return $this->page($q !== '' ? "Search: {$q}" : 'Search Doon', 'Search businesses, places, events and stories in Dehradun.', $path, robots: 'noindex,follow');
        }
        if (isset(self::STATIC_PAGES[$path])) {
            [$title, $description] = self::STATIC_PAGES[$path];

            return $this->listPage($path, $title, $description, $query);
        }

        $segments = explode('/', ltrim($path, '/'));
        if (count($segments) !== 2 || ! preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $segments[1])) {
            return $this->notFound($path);
        }
        [$section, $slug] = $segments;

        return match ($section) {
            'business' => $this->business($slug),
            'place' => $this->place($slug),
            'event' => $this->event($slug),
            'story', 'guide' => $this->story($slug, $section),
            'collection' => $this->collection($slug),
            'area' => $this->area($slug),
            'businesses' => $this->categoryPage($slug, CategoryType::Business, '/businesses', $query),
            'places' => $this->categoryPage($slug, CategoryType::Place, '/places', $query),
            default => $this->notFound($path),
        };
    }

    // ------------------------------------------------------------------ pages

    private function home(): SeoPage
    {
        $page = $this->page($this->seo['home_title'], $this->seo['home_description'], '/', applyTemplate: false, override: $this->pathOverride('/'));
        $sameAs = array_values(array_filter([
            $this->social['facebook_url'], $this->social['instagram_url'], $this->social['x_url'],
            $this->social['youtube_url'], $this->social['linkedin_url'],
        ]));
        $page->jsonLd = [
            [
                '@type' => 'WebSite',
                '@id' => self::absoluteUrl('/').'#website',
                'name' => $this->seo['site_name'],
                'url' => self::absoluteUrl('/'),
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => ['@type' => 'EntryPoint', 'urlTemplate' => self::absoluteUrl('/search').'?q={search_term_string}'],
                    'query-input' => 'required name=search_term_string',
                ],
            ],
            array_filter([
                '@type' => 'Organization',
                '@id' => self::absoluteUrl('/').'#organization',
                'name' => $this->seo['site_name'],
                'url' => self::absoluteUrl('/'),
                'logo' => self::absoluteUrl('/favicon.svg'),
                'sameAs' => $sameAs ?: null,
            ]),
        ];

        return $page;
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function listPage(string $path, string $title, string $description, array $query, array $crumbs = []): SeoPage
    {
        $pageNo = max(1, (int) ($query['page'] ?? 1));
        $filtered = array_diff(array_keys(array_filter($query, fn ($v) => $v !== null && $v !== '')), ['page']) !== [];
        $canonicalPath = $path.($pageNo > 1 ? "?page={$pageNo}" : '');

        $page = $this->page($title.($pageNo > 1 ? " — page {$pageNo}" : ''), $description, $canonicalPath,
            // Filtered variants are near-duplicates of the canonical list.
            robots: $filtered ? 'noindex,follow' : 'index,follow', override: $this->pathOverride($path));

        $crumbs = $crumbs ?: [[$title, $path]];
        $page->jsonLd = [
            ['@type' => 'CollectionPage', 'name' => $title, 'url' => self::absoluteUrl($path), 'description' => $page->description],
            $this->breadcrumbs($crumbs),
        ];

        return $page;
    }

    /**
     * @param  array<string, mixed>  $query
     */
    private function categoryPage(string $slug, CategoryType $type, string $base, array $query): SeoPage
    {
        $category = Category::query()->active()->ofType($type)->where('slug', $slug)->with('parent')->first();
        if (! $category) {
            return $this->notFound("{$base}/{$slug}");
        }

        $title = $type === CategoryType::Business ? "{$category->name} in Dehradun" : "{$category->name} near Dehradun";
        $description = $category->description
            ?: "Find {$category->name} in Dehradun on DoonPortal — locations, opening hours, contact details and more.";
        $crumbs = [[self::STATIC_PAGES[$base][0], $base]];
        if ($category->parent) {
            $crumbs[] = [$category->parent->name, "{$base}/{$category->parent->slug}"];
        }
        $crumbs[] = [$category->name, "{$base}/{$slug}"];

        return $this->listPage("{$base}/{$slug}", $title, $description, $query, $crumbs);
    }

    private function business(string $slug): SeoPage
    {
        $b = Business::query()->public()->where('slug', $slug)->with(['cover', 'logo', 'categories:id,name,slug', 'primaryArea:id,name'])->first();
        if (! $b) {
            return $this->notFound("/business/{$slug}");
        }

        $area = $b->primaryArea?->name;
        $page = $this->entityPage($b, $b->name.($area ? " — {$area}, Dehradun" : ', Dehradun'),
            $b->tagline ?: $b->description, "/business/{$slug}", 'business.business', $b->cover ?? $b->logo);

        if (! $b->isDemo()) {
            $category = $b->categories->first();
            $page->jsonLd = [
                array_filter([
                    '@type' => 'LocalBusiness',
                    '@id' => self::absoluteUrl("/business/{$slug}").'#business',
                    'name' => $b->name,
                    'description' => $b->description ? Str::limit(strip_tags($b->description), 500) : null,
                    'url' => self::absoluteUrl("/business/{$slug}"),
                    'telephone' => $b->phone,
                    'sameAs' => $b->website ? [$b->website] : null,
                    'image' => $page->image,
                    'priceRange' => $b->price_range ? str_repeat('₹', $b->price_range) : null,
                    'address' => array_filter([
                        '@type' => 'PostalAddress',
                        'streetAddress' => $b->address_line,
                        'addressLocality' => $b->locality ?: $b->city,
                        'addressRegion' => 'Uttarakhand',
                        'postalCode' => $b->pincode,
                        'addressCountry' => 'IN',
                    ]),
                    'geo' => $b->latitude !== null ? ['@type' => 'GeoCoordinates', 'latitude' => $b->latitude, 'longitude' => $b->longitude] : null,
                    'aggregateRating' => $b->rating_count > 0
                        ? ['@type' => 'AggregateRating', 'ratingValue' => $b->rating_avg, 'reviewCount' => $b->rating_count] : null,
                ]),
                $this->breadcrumbs([
                    ['Businesses', '/businesses'],
                    ...($category ? [[$category->name, "/businesses/{$category->slug}"]] : []),
                    [$b->name, "/business/{$slug}"],
                ]),
            ];
        }

        return $page;
    }

    private function place(string $slug): SeoPage
    {
        $p = Place::query()->public()->where('slug', $slug)->with(['cover', 'primaryArea:id,name'])->first();
        if (! $p) {
            return $this->notFound("/place/{$slug}");
        }

        $page = $this->entityPage($p, $p->name.', Dehradun', $p->summary ?: $p->description, "/place/{$slug}", 'website', $p->cover);
        if (! $p->isDemo()) {
            $page->jsonLd = [
                array_filter([
                    '@type' => 'TouristAttraction',
                    'name' => $p->name,
                    'description' => $p->description ? Str::limit(strip_tags($p->description), 500) : $p->summary,
                    'url' => self::absoluteUrl("/place/{$slug}"),
                    'image' => $page->image,
                    'isAccessibleForFree' => $p->is_free,
                    'geo' => $p->latitude !== null ? ['@type' => 'GeoCoordinates', 'latitude' => $p->latitude, 'longitude' => $p->longitude] : null,
                    'address' => ['@type' => 'PostalAddress', 'addressLocality' => $p->primaryArea?->name ?? 'Dehradun', 'addressRegion' => 'Uttarakhand', 'addressCountry' => 'IN'],
                ], fn ($v) => $v !== null),
                $this->breadcrumbs([['Things to do', '/places'], [$p->name, "/place/{$slug}"]]),
            ];
        }

        return $page;
    }

    private function event(string $slug): SeoPage
    {
        $e = Event::query()->public()->where('slug', $slug)->with(['cover', 'venue', 'organizer:id,name'])->first();
        if (! $e) {
            return $this->notFound("/event/{$slug}");
        }

        $tz = $e->timezone ?: 'Asia/Kolkata';
        $when = $e->starts_at?->copy()->setTimezone($tz)->format('j M Y');
        $page = $this->entityPage($e, $e->title.($when ? " — {$when}" : ''), $e->summary ?: $e->description, "/event/{$slug}", 'website', $e->cover);

        if (! $e->isDemo()) {
            $status = $e->status->value === 'CANCELLED' ? 'EventCancelled' : ($e->isRescheduled() ? 'EventRescheduled' : 'EventScheduled');
            $page->jsonLd = [
                array_filter([
                    '@type' => 'Event',
                    'name' => $e->title,
                    'description' => $e->description ? Str::limit(strip_tags($e->description), 500) : $e->summary,
                    'url' => self::absoluteUrl("/event/{$slug}"),
                    'image' => $page->image,
                    'startDate' => $e->starts_at?->copy()->setTimezone($tz)->toIso8601String(),
                    'endDate' => $e->ends_at?->copy()->setTimezone($tz)->toIso8601String(),
                    'previousStartDate' => $e->original_starts_at?->copy()->setTimezone($tz)->toIso8601String(),
                    'eventStatus' => "https://schema.org/{$status}",
                    'eventAttendanceMode' => $e->venue ? 'https://schema.org/OfflineEventAttendanceMode'
                        : ($e->online_url ? 'https://schema.org/OnlineEventAttendanceMode' : null),
                    'location' => $e->venue ? array_filter([
                        '@type' => 'Place',
                        'name' => $e->venue->name,
                        'address' => ['@type' => 'PostalAddress', 'streetAddress' => $e->venue->address_line, 'addressLocality' => 'Dehradun', 'addressRegion' => 'Uttarakhand', 'addressCountry' => 'IN'],
                    ]) : ($e->online_url ? ['@type' => 'VirtualLocation', 'url' => $e->online_url] : null),
                    'organizer' => $e->organizer ? ['@type' => 'Organization', 'name' => $e->organizer->name] : null,
                    'isAccessibleForFree' => $e->is_free ?: null,
                    'offers' => $e->ticket_url ? array_filter([
                        '@type' => 'Offer',
                        'url' => $e->ticket_url,
                        'price' => $e->is_free ? 0 : ($e->price_min_paise !== null ? $e->price_min_paise / 100 : null),
                        'priceCurrency' => $e->currency,
                    ], fn ($v) => $v !== null) : null,
                ], fn ($v) => $v !== null),
                $this->breadcrumbs([['Events', '/events'], [$e->title, "/event/{$slug}"]]),
            ];
        }

        return $page;
    }

    private function story(string $slug, string $section): SeoPage
    {
        $s = Story::query()->public()->where('slug', $slug)->with(['cover', 'author:id,name'])->first();
        if (! $s) {
            return $this->notFound("/{$section}/{$slug}");
        }

        // One URL per story: guides live under /guide, everything else under /story.
        $expected = $s->type === StoryType::Guide ? 'guide' : 'story';
        if ($section !== $expected) {
            $page = $this->notFound("/{$section}/{$slug}");
            $page->status = 301;
            $page->redirect = "/{$expected}/{$slug}";

            return $page;
        }

        $path = "/{$expected}/{$slug}";
        $page = $this->entityPage($s, $s->seo_title ?: $s->title, $s->seo_description ?: $s->excerpt ?: $s->body, $path, 'article', $s->cover);

        if (! $s->isDemo()) {
            $page->jsonLd = [
                array_filter([
                    '@type' => $s->type === StoryType::News ? 'NewsArticle' : 'Article',
                    'headline' => Str::limit($s->title, 110, ''),
                    'description' => $page->description,
                    'url' => self::absoluteUrl($path),
                    'mainEntityOfPage' => self::absoluteUrl($path),
                    'image' => $page->image,
                    'datePublished' => $s->published_at?->toIso8601String(),
                    'dateModified' => $s->updated_at?->toIso8601String(),
                    'author' => $s->author ? ['@type' => 'Person', 'name' => $s->author->name] : ['@type' => 'Organization', 'name' => $this->seo['site_name']],
                    'publisher' => ['@type' => 'Organization', 'name' => $this->seo['site_name'], 'logo' => ['@type' => 'ImageObject', 'url' => self::absoluteUrl('/favicon.svg')]],
                ]),
                $this->breadcrumbs([['Stories', '/stories'], [$s->title, $path]]),
            ];
        }

        return $page;
    }

    private function collection(string $slug): SeoPage
    {
        $c = Collection::query()->public()->where('slug', $slug)->with('cover')->first();
        if (! $c) {
            return $this->notFound("/collection/{$slug}");
        }

        $page = $this->entityPage($c, $c->title, $c->description, "/collection/{$slug}", 'website', $c->cover);
        if (! $c->isDemo()) {
            $page->jsonLd = [
                ['@type' => 'CollectionPage', 'name' => $c->title, 'url' => self::absoluteUrl("/collection/{$slug}"), 'description' => $page->description],
                $this->breadcrumbs([['Best of Doon', '/collections'], [$c->title, "/collection/{$slug}"]]),
            ];
        }

        return $page;
    }

    private function area(string $slug): SeoPage
    {
        $a = Area::query()->public()->where('slug', $slug)->with('cover')->first();
        if (! $a) {
            return $this->notFound("/area/{$slug}");
        }

        $page = $this->entityPage($a, "{$a->name}, Dehradun — things to do, places & businesses",
            $a->summary ?: "Businesses, places, events and stories in {$a->name}, Dehradun.", "/area/{$slug}", 'website', $a->cover);
        $page->jsonLd = [
            array_filter([
                '@type' => 'Place',
                'name' => "{$a->name}, Dehradun",
                'url' => self::absoluteUrl("/area/{$slug}"),
                'description' => $page->description,
                'geo' => $a->latitude !== null ? ['@type' => 'GeoCoordinates', 'latitude' => $a->latitude, 'longitude' => $a->longitude] : null,
            ]),
            $this->breadcrumbs([['Areas', '/areas'], [$a->name, "/area/{$slug}"]]),
        ];

        return $page;
    }

    // ---------------------------------------------------------------- helpers

    private function entityPage(Model $model, string $title, ?string $description, string $path, string $type, ?Media $image): SeoPage
    {
        $override = SeoMeta::query()->where('entity_type', $model->getMorphClass())->where('entity_id', $model->getKey())->with('image')->first();
        $page = $this->page($title, $description, $path, type: $type,
            override: $override, image: $image);

        if (method_exists($model, 'isDemo') && $model->isDemo()) {
            // Fictional demo records must never reach search engines.
            $page->robots = 'noindex,nofollow';
        }

        return $page;
    }

    private function page(string $title, ?string $description, string $path, string $robots = 'index,follow', string $type = 'website',
        ?SeoMeta $override = null, ?Media $image = null, bool $applyTemplate = true): SeoPage
    {
        $title = $override?->title ?: $title;
        $fullTitle = $applyTemplate ? str_replace('%s', $title, $this->seo['title_template']) : $title;
        $description = $override?->description ?: $this->cleanDescription($description) ?: $this->seo['default_description'];
        $imageMedia = $override?->image ?? $image ?? ($this->seo['default_image_media_id'] ? Media::find($this->seo['default_image_media_id']) : null);

        return new SeoPage(
            title: Str::limit($fullTitle, 120, ''),
            description: $description,
            canonical: self::absoluteUrl($path),
            robots: $override?->noindex ? 'noindex,follow' : $robots,
            type: $type,
            image: $this->absolute($imageMedia?->url()),
            siteName: $this->seo['site_name'],
            twitterHandle: $this->social['x_handle'],
        );
    }

    private function notFound(string $path): SeoPage
    {
        return new SeoPage(
            title: str_replace('%s', 'Page not found', $this->seo['title_template']),
            description: $this->seo['default_description'],
            canonical: self::absoluteUrl($path),
            robots: 'noindex,follow',
            status: 404,
            siteName: $this->seo['site_name'],
        );
    }

    private function pathOverride(string $path): ?SeoMeta
    {
        return SeoMeta::query()->where('path', $path)->with('image')->first();
    }

    private function cleanDescription(?string $text): ?string
    {
        $text = trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags((string) $text))));

        return $text === '' ? null : Str::limit($text, 157);
    }

    private function absolute(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        return preg_match('#^https?://#', $url) ? $url : self::absoluteUrl($url);
    }

    /**
     * @param  list<array{0: string, 1: string}>  $items  [label, path] after "Home"
     * @return array<string, mixed>
     */
    private function breadcrumbs(array $items): array
    {
        $list = [['Home', '/'], ...$items];

        return [
            '@type' => 'BreadcrumbList',
            'itemListElement' => array_map(fn ($item, $i) => [
                '@type' => 'ListItem',
                'position' => $i + 1,
                'name' => $item[0],
                'item' => self::absoluteUrl($item[1]),
            ], $list, array_keys($list)),
        ];
    }

    /** Absolute URL; the site root keeps its trailing slash (https://host/). */
    public static function absoluteUrl(string $path): string
    {
        return $path === '/' ? rtrim(url('/'), '/').'/' : url($path);
    }
}
