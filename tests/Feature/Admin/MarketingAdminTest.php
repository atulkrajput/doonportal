<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Models\AnalyticsEvent;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Plan;
use App\Models\SeoMeta;
use App\Models\Subscription;
use Illuminate\Support\Carbon;

/**
 * Settings (SEO, social, tracking), SEO overrides, monetization and analytics.
 */
class MarketingAdminTest extends AdminTestCase
{
    public function test_tracking_settings_accept_ids_only_and_are_audited(): void
    {
        $this->actingAsRole(RoleName::Admin);

        $this->putJson('/api/v1/admin/settings/tracking', [
            'ga4_measurement_id' => '<script>alert(1)</script>',
            'gtm_container_id' => 'GTM-1234"onload="x',
            'meta_pixel_id' => 'abc',
            'clarity_project_id' => 'UPPER',
        ])->assertUnprocessable()->assertJsonValidationErrors(['ga4_measurement_id', 'gtm_container_id', 'meta_pixel_id', 'clarity_project_id']);

        $this->putJson('/api/v1/admin/settings/tracking', ['ga4_measurement_id' => 'G-ABC123XYZ', 'meta_pixel_id' => '1234567890'])
            ->assertOk()->assertJsonPath('data.ga4_measurement_id', 'G-ABC123XYZ')->assertJsonPath('data.gtm_container_id', null);

        $log = AuditLog::where('action', 'settings.tracking_updated')->sole();
        $this->assertSame(['ga4_measurement_id' => null, 'meta_pixel_id' => null], $log->old_values);

        $this->getJson('/api/v1/admin/settings/nope')->assertNotFound();
    }

    public function test_social_profiles_must_point_at_the_right_site(): void
    {
        $this->actingAsRole(RoleName::Admin);

        $this->putJson('/api/v1/admin/settings/social', ['instagram_url' => 'https://evil.test/doon', 'facebook_url' => 'javascript:alert(1)'])
            ->assertUnprocessable()->assertJsonValidationErrors(['instagram_url', 'facebook_url']);
        $this->putJson('/api/v1/admin/settings/social', ['instagram_url' => 'https://www.instagram.com/example', 'x_handle' => 'example'])
            ->assertOk()->assertJsonPath('data.x_handle', '@example');
    }

    public function test_editors_manage_seo_but_not_tracking_or_social(): void
    {
        $this->actingAsRole(RoleName::Editor);

        $this->getJson('/api/v1/admin/settings/seo')->assertOk()->assertJsonPath('data.site_name', 'DoonPortal');
        $this->putJson('/api/v1/admin/settings/seo', ['site_name' => 'DoonPortal', 'title_template' => 'no placeholder', 'home_title' => 'x', 'home_description' => 'x', 'default_description' => 'x', 'allow_indexing' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('title_template');
        $this->getJson('/api/v1/admin/settings/tracking')->assertForbidden();
        $this->putJson('/api/v1/admin/settings/social', [])->assertForbidden();
    }

    public function test_seo_overrides_for_pages_and_records(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $business = Business::factory()->create(['is_published' => true]);

        $this->postJson('/api/v1/admin/seo', ['path' => '/events', 'title' => 'Events this week in Doon', 'description' => 'What is on.'])->assertCreated();
        $this->postJson('/api/v1/admin/seo', ['path' => "/business/{$business->slug}", 'title' => 'x'])
            ->assertUnprocessable()->assertJsonValidationErrors('path');
        $this->postJson('/api/v1/admin/seo', ['path' => '/events'])->assertUnprocessable()->assertJsonValidationErrors('path');

        $id = $this->postJson('/api/v1/admin/seo', ['entity_type' => 'business', 'entity_id' => $business->id, 'title' => 'Best coffee', 'noindex' => true])
            ->assertCreated()->assertJsonPath('data.entity_label', $business->name)->json('data.id');
        $this->postJson('/api/v1/admin/seo', ['entity_type' => 'business', 'entity_id' => $business->id])->assertUnprocessable();
        $this->postJson('/api/v1/admin/seo', ['entity_type' => 'user', 'entity_id' => $business->id])->assertUnprocessable();

        $this->getJson("/api/v1/admin/seo/entity/business/{$business->id}")->assertOk()->assertJsonPath('data.title', 'Best coffee');
        $this->getJson('/api/v1/admin/seo/preview?path='.urlencode("/business/{$business->slug}"))->assertOk()
            ->assertJsonPath('data.title', 'Best coffee | DoonPortal')->assertJsonPath('data.robots', 'noindex,follow');

        $this->patchJson("/api/v1/admin/seo/{$id}", ['noindex' => false, 'path' => '/x'])->assertUnprocessable();
        $this->patchJson("/api/v1/admin/seo/{$id}", ['noindex' => false])->assertOk()->assertJsonPath('data.noindex', false);
        $this->deleteJson("/api/v1/admin/seo/{$id}")->assertNoContent();
        $this->assertSame(1, SeoMeta::count());
        $this->assertSame(2, AuditLog::where('action', 'seo_meta.created')->count());
        $this->assertSame(1, AuditLog::where('action', 'seo_meta.updated')->count());
        $this->assertNotNull(AuditLog::where('action', 'seo_meta.deleted')->first());

        $this->getJson('/api/v1/admin/seo/audit')->assertOk()->assertJsonStructure(['data' => ['business' => ['public', 'missing_description', 'missing_image', 'long_titles', 'examples']]]);
    }

    public function test_plans_subscriptions_and_revenue_from_recorded_payments(): void
    {
        $admin = $this->actingAsRole(RoleName::Admin);
        $business = Business::factory()->create();

        $planId = $this->postJson('/api/v1/admin/plans', ['name' => 'Featured', 'price_paise' => 99900, 'interval' => 'MONTH', 'features' => ['Top of listings']])
            ->assertCreated()->assertJsonPath('data.slug', 'featured')->json('data.id');
        $this->postJson('/api/v1/admin/plans', ['name' => 'Bad', 'price_paise' => -1, 'interval' => 'WEEK'])
            ->assertUnprocessable()->assertJsonValidationErrors(['price_paise', 'interval']);

        // Defaults: amount from the plan, one billing period.
        $sub = $this->postJson('/api/v1/admin/subscriptions', [
            'business_id' => $business->id, 'plan_id' => $planId, 'status' => 'ACTIVE', 'starts_on' => '2026-10-01',
        ])->assertCreated()->assertJsonPath('data.amount_paise', 99900)->json('data');
        $this->assertSame('2026-10-31', substr($sub['ends_on'], 0, 10));
        $this->assertSame($admin->id, Subscription::find($sub['id'])->created_by);

        $this->postJson('/api/v1/admin/subscriptions', ['business_id' => $business->id, 'plan_id' => $planId, 'starts_on' => '2026-10-01', 'ends_on' => '2026-09-01'])
            ->assertUnprocessable()->assertJsonValidationErrors('ends_on');
        $this->patchJson("/api/v1/admin/subscriptions/{$sub['id']}", ['paid_at' => '2026-10-02T10:00'])
            ->assertUnprocessable()->assertJsonValidationErrors('payment_method');

        Carbon::setTestNow('2026-10-20 12:00:00');
        $this->patchJson("/api/v1/admin/subscriptions/{$sub['id']}", ['paid_at' => '2026-10-02T10:00', 'payment_method' => 'UPI', 'payment_reference' => 'UPI-REF-1'])->assertOk();
        $this->assertNotNull(AuditLog::where('action', 'subscription.updated')->first());

        $revenue = $this->getJson('/api/v1/admin/revenue?from=2026-10-01&to=2026-10-31')->assertOk()->json('data');
        $this->assertSame(99900, $revenue['total_paise']);
        $this->assertSame(1, $revenue['payments']);
        $this->assertSame(99900, $revenue['mrr_paise']);
        $this->assertSame([['plan' => 'Featured', 'amount_paise' => 99900]], $revenue['by_plan']);
        $this->assertCount(1, $revenue['upcoming_renewals']);

        // Unpaid subscriptions never count as revenue.
        $this->postJson('/api/v1/admin/subscriptions', ['business_id' => $business->id, 'plan_id' => $planId, 'starts_on' => '2026-10-05'])->assertCreated();
        $this->assertSame(99900, $this->getJson('/api/v1/admin/revenue?from=2026-10-01&to=2026-10-31')->json('data.total_paise'));

        $this->deleteJson("/api/v1/admin/plans/{$planId}")->assertUnprocessable();
        $this->assertSame(1, Plan::count());
        Carbon::setTestNow();
    }

    public function test_analytics_report_and_page_view_tracking(): void
    {
        $business = Business::factory()->create(['is_published' => true, 'name' => 'Tracked Cafe']);

        $this->postJson('/api/v1/analytics/events', ['name' => 'page_view', 'properties' => ['path' => '/events']])->assertStatus(202);
        $this->postJson('/api/v1/analytics/events', ['name' => 'page_view', 'properties' => ['path' => '/events']])->assertStatus(202);
        $this->postJson('/api/v1/analytics/events', ['name' => 'business_viewed', 'entity_type' => 'business', 'entity_id' => $business->id])->assertStatus(202);
        $this->postJson('/api/v1/analytics/events', ['name' => 'search_performed', 'properties' => ['query' => 'Cafe']])->assertStatus(202);
        $this->assertSame(4, AnalyticsEvent::count());

        $this->actingAsRole(RoleName::Editor);
        $data = $this->getJson('/api/v1/admin/analytics')->assertOk()->json('data');
        $this->assertSame(4, $data['totals']['events']);
        $this->assertSame(2, $data['totals']['page_views']);
        $this->assertSame([['path' => '/events', 'views' => 2]], $data['top_pages']);
        $this->assertSame('Tracked Cafe', $data['top_entities'][0]['label']);
        $this->assertSame('cafe', $data['top_searches'][0]['query']);
        $this->assertCount(30, $data['daily']);

        $this->getJson('/api/v1/admin/analytics?from=2026-10-10&to=2026-10-01')->assertUnprocessable();
    }
}
