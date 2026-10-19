<?php

namespace Tests\Feature;

use App\Enums\PublicationStatus;
use App\Enums\RoleName;
use App\Models\AuditLog;
use App\Models\Page;
use App\Models\User;
use App\Services\SiteSettings;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SitePagesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SitePagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed([RolePermissionSeeder::class, SitePagesSeeder::class]);
    }

    private function actingAsRole(RoleName $role): User
    {
        $user = User::factory()->create()->assignRole(RoleName::User, $role);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_seeded_pages_are_published_and_seeding_never_overwrites_edits(): void
    {
        $this->assertSame(['about', 'community-guidelines', 'contact', 'cookies', 'disclaimer', 'privacy', 'terms'],
            Page::public()->orderBy('slug')->pluck('slug')->all());

        Page::where('slug', 'privacy')->update(['title' => 'Edited privacy']);
        $this->seed(SitePagesSeeder::class);

        $this->assertSame(7, Page::count());
        $this->assertSame('Edited privacy', Page::where('slug', 'privacy')->value('title'));
    }

    public function test_pages_fill_legal_details_escaped_and_never_invent_missing_ones(): void
    {
        $body = $this->getJson('/api/v1/pages/contact')->assertOk()->json('data.body');
        $this->assertStringContainsString('(to be published)', $body);
        $this->assertStringNotContainsString('{{', $body);

        app(SiteSettings::class)->update('legal', [
            'operator_name' => 'Doon <Media> LLP',
            'contact_email' => 'hello@example.test',
            'grievance_officer_name' => 'A. Officer',
            'grievance_officer_email' => 'grievance@example.test',
            'postal_address' => "1 Test Road\nDehradun",
        ]);

        $privacy = $this->getJson('/api/v1/pages/privacy')->assertOk()->json('data.body');
        $this->assertStringContainsString('Doon &lt;Media&gt; LLP', $privacy);
        $this->assertStringContainsString('<a href="mailto:hello@example.test">hello@example.test</a>', $privacy);
        $this->assertStringContainsString('We do not currently use any third-party analytics', $privacy);

        app(SiteSettings::class)->update('tracking', ['ga4_measurement_id' => 'G-ABCDE123', 'meta_pixel_id' => '1234567890']);
        $cookies = $this->getJson('/api/v1/pages/cookies')->json('data.body');
        $this->assertStringContainsString('Google Analytics 4', $cookies);
        $this->assertStringContainsString('Meta Pixel', $cookies);
    }

    public function test_page_urls_seo_and_drafts(): void
    {
        $this->get('/privacy')->assertOk()
            ->assertSee('<title>Privacy policy | DoonPortal</title>', false)
            ->assertSee('<link rel="canonical" href="'.url('/privacy').'">', false);
        $this->get('/about')->assertOk()->assertSee('"@type":"AboutPage"', false);
        $this->get('/contact')->assertOk()->assertSee('"@type":"ContactPage"', false);
        $this->get('/no-such-page')->assertNotFound();

        Page::where('slug', 'disclaimer')->update(['status' => PublicationStatus::Draft->value]);
        $this->get('/disclaimer')->assertNotFound();
        $this->getJson('/api/v1/pages/disclaimer')->assertNotFound();
        $this->assertStringNotContainsString('/disclaimer', $this->get('/sitemap.xml')->getContent());
        $this->assertStringContainsString(url('/privacy'), $this->get('/sitemap.xml')->getContent());

        $this->getJson('/api/v1/pages')->assertOk()->assertJsonCount(6, 'data');
    }

    public function test_shell_carries_consent_config_and_footer_pages(): void
    {
        app(SiteSettings::class)->update('tracking', ['ga4_measurement_id' => 'G-ABCDE123', 'clarity_project_id' => 'abc123def']);

        $html = $this->get('/')->assertOk()->getContent();
        preg_match('#<script type="application/json" id="site-config">(.*?)</script>#s', $html, $m);
        $config = json_decode($m[1], true);

        $this->assertSame(['Google Analytics 4', 'Microsoft Clarity'], array_column($config['consent']['tools']['analytics'], 'name'));
        $this->assertSame([], $config['consent']['tools']['marketing']);
        $this->assertSame('G-ABCDE123', $config['tracking']['ga4_measurement_id']);
        $this->assertContains('/privacy', array_column($config['footer_pages'], 'path'));

        $admin = $this->get('/admin')->getContent();
        preg_match('#<script type="application/json" id="site-config">(.*?)</script>#s', $admin, $m);
        $this->assertSame([], (array) json_decode($m[1], true)['tracking'], 'No tracking IDs are handed to the admin area.');

        // The consent version changes when the set of tools changes, so visitors are asked again.
        $version = $config['consent']['version'];
        app(SiteSettings::class)->update('tracking', ['meta_pixel_id' => '1234567890']);
        preg_match('#id="site-config">(.*?)</script>#s', $this->get('/')->getContent(), $m);
        $this->assertNotSame($version, json_decode($m[1], true)['consent']['version']);
    }

    public function test_admin_page_management_permissions_and_rules(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $this->getJson('/api/v1/admin/pages')->assertForbidden();
        $this->getJson('/api/v1/admin/settings/legal')->assertForbidden();

        $this->actingAsRole(RoleName::Admin);
        $this->getJson('/api/v1/admin/pages')->assertOk()->assertJsonCount(7, 'data');

        $this->postJson('/api/v1/admin/pages', ['title' => 'Login', 'slug' => 'login'])->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->postJson('/api/v1/admin/pages', ['title' => 'Dup', 'slug' => 'privacy'])->assertUnprocessable()->assertJsonValidationErrors('slug');

        $id = $this->postJson('/api/v1/admin/pages', ['title' => 'Refund policy', 'body' => '<p onclick="x()">Refunds within 7 days.</p><script>alert(1)</script>'])
            ->assertCreated()->assertJsonPath('data.slug', 'refund-policy')->assertJsonPath('data.status', 'DRAFT')->json('data.id');
        $page = Page::find($id);
        $this->assertStringNotContainsString('<script', $page->body);
        $this->assertStringNotContainsString('onclick', $page->body);

        $this->get('/refund-policy')->assertNotFound();
        $this->postJson("/api/v1/admin/pages/{$id}/status", ['status' => 'PUBLISHED'])->assertOk();
        $this->get('/refund-policy')->assertOk()->assertSee('<title>Refund policy | DoonPortal</title>', false);
        $this->assertNotNull(AuditLog::where('action', 'page.status_changed')->first());

        $empty = $this->postJson('/api/v1/admin/pages', ['title' => 'Empty'])->json('data.id');
        $this->postJson("/api/v1/admin/pages/{$empty}/status", ['status' => 'PUBLISHED'])->assertStatus(409);

        $this->putJson('/api/v1/admin/settings/legal', ['contact_email' => 'not-an-email', 'jurisdiction_city' => 'Dehradun'])
            ->assertUnprocessable()->assertJsonValidationErrors('contact_email');
        $this->getJson('/api/v1/admin/dashboard')->assertOk()->assertJsonPath('data.setup.0.key', 'legal');
    }
}
