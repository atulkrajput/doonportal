<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\Business;
use App\Models\Category;
use App\Models\Event;
use App\Models\SeoMeta;
use App\Models\Story;
use App\Services\SiteSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpaRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_frontend_paths_serve_the_spa_shell_with_server_rendered_seo(): void
    {
        $business = Business::factory()->create(['name' => 'Test Corner Cafe', 'tagline' => 'Good coffee near the clock tower', 'is_published' => true]);

        $this->get('/')->assertOk()
            ->assertSee('<div id="app"></div>', false)
            ->assertSee('<title>DoonPortal — All Things Doon</title>', false)
            ->assertSee('"@type":"WebSite"', false)
            ->assertSee('<link rel="canonical" href="'.url('/').'/">', false);

        $this->get("/business/{$business->slug}")->assertOk()
            ->assertSee('<title>Test Corner Cafe, Dehradun | DoonPortal</title>', false)
            ->assertSee('content="Good coffee near the clock tower"', false)
            ->assertSee('<meta name="robots" content="index,follow">', false)
            ->assertSee('"@type":"LocalBusiness"', false)
            ->assertSee('"@type":"BreadcrumbList"', false);

        $this->get('/events?when=weekend')->assertOk()
            ->assertSee('<meta name="robots" content="noindex,follow">', false)
            ->assertSee('<link rel="canonical" href="'.url('/events').'">', false);
    }

    public function test_unknown_pages_and_hidden_records_return_404_with_noindex(): void
    {
        $draft = Business::factory()->create(['is_published' => false]);

        foreach (['/business/no-such-cafe', "/business/{$draft->slug}", '/place/nope', '/nonsense/page/here', '/businesses/not-a-category'] as $path) {
            $this->get($path)->assertNotFound()
                ->assertSee('<div id="app"></div>', false)
                ->assertSee('noindex', false);
        }
    }

    public function test_canonical_redirects(): void
    {
        $guide = Story::factory()->create(['type' => 'GUIDE', 'status' => 'PUBLISHED', 'published_at' => now()->subDay(), 'body' => '<p>x</p>']);

        $this->get('/Events/')->assertStatus(301)->assertRedirect('/events');
        $this->get("/story/{$guide->slug}")->assertStatus(301)->assertRedirect("/guide/{$guide->slug}");
        $this->get("/guide/{$guide->slug}")->assertOk()->assertSee('"@type":"Article"', false);
    }

    public function test_demo_records_private_pages_and_admin_are_not_indexed(): void
    {
        $demo = Business::factory()->create(['is_published' => true, 'metadata' => ['demo' => true]]);

        $this->get("/business/{$demo->slug}")->assertOk()
            ->assertSee('<meta name="robots" content="noindex,nofollow">', false)
            ->assertDontSee('LocalBusiness', false);
        $this->get('/login')->assertOk()->assertSee('content="noindex,follow"', false);
        $this->get('/admin/businesses')->assertOk()->assertSee('content="noindex,nofollow"', false);
    }

    public function test_overrides_and_settings_apply(): void
    {
        $business = Business::factory()->create(['name' => 'Override Me', 'is_published' => true]);
        SeoMeta::create(['entity_type' => 'business', 'entity_id' => $business->id, 'title' => 'Custom title', 'description' => 'Custom description']);
        SeoMeta::create(['path' => '/events', 'title' => 'Doon events this month', 'noindex' => true]);
        app(SiteSettings::class)->update('tracking', ['ga4_measurement_id' => 'G-TEST1234']);

        $this->get("/business/{$business->slug}")->assertOk()
            ->assertSee('<title>Custom title | DoonPortal</title>', false)
            ->assertSee('content="Custom description"', false)
            ->assertSee('gtag/js?id=G-TEST1234', false);
        $this->get('/events')->assertSee('<title>Doon events this month | DoonPortal</title>', false)
            ->assertSee('content="noindex,follow"', false);
        $this->get('/admin')->assertDontSee('G-TEST1234', false);

        app(SiteSettings::class)->update('seo', ['allow_indexing' => false]);
        $this->get('/')->assertSee('content="noindex,nofollow"', false);
        $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /');
    }

    public function test_robots_and_sitemap(): void
    {
        $real = Business::factory()->create(['is_published' => true]);
        $demo = Business::factory()->create(['is_published' => true, 'metadata' => ['demo' => true]]);
        $hidden = Business::factory()->create(['is_published' => true]);
        SeoMeta::create(['entity_type' => 'business', 'entity_id' => $hidden->id, 'noindex' => true]);
        $category = Category::factory()->create(['type' => 'business', 'is_active' => true]);
        $past = Event::factory()->create(['status' => EventStatus::Published, 'starts_at' => now()->subMonth(), 'ends_at' => now()->subMonth()->addHour()]);

        $this->get('/robots.txt')->assertOk()
            ->assertHeader('content-type', 'text/plain; charset=UTF-8')
            ->assertSee('Disallow: /admin')
            ->assertSee('Sitemap: '.url('/sitemap.xml'));

        $xml = $this->get('/sitemap.xml')->assertOk()->assertHeader('content-type', 'application/xml; charset=UTF-8')->getContent();
        $this->assertStringContainsString(url("/business/{$real->slug}"), $xml);
        $this->assertStringContainsString(url("/businesses/{$category->slug}"), $xml);
        $this->assertStringContainsString(url('/events'), $xml);
        $this->assertStringNotContainsString($demo->slug, $xml);
        $this->assertStringNotContainsString($hidden->slug, $xml);
        $this->assertStringNotContainsString($past->slug, $xml);
    }

    public function test_seo_api_matches_the_server_shell(): void
    {
        $business = Business::factory()->create(['name' => 'Api Cafe', 'is_published' => true]);

        $this->getJson('/api/v1/seo?path='.urlencode("/business/{$business->slug}"))->assertOk()
            ->assertJsonPath('data.title', 'Api Cafe, Dehradun | DoonPortal')
            ->assertJsonPath('data.status', 200)
            ->assertJsonPath('data.canonical', url("/business/{$business->slug}"));
        $this->getJson('/api/v1/seo?path=/business/missing')->assertOk()->assertJsonPath('data.status', 404);
        $this->getJson('/api/v1/seo?path=https://evil.test/')->assertUnprocessable();
    }

    public function test_unknown_api_paths_return_json_not_the_spa(): void
    {
        $this->get('/api/v1/nope')->assertNotFound()->assertHeader('content-type', 'application/json');
        $this->get('/api')->assertNotFound();
        $this->get('/up')->assertOk();
    }
}
