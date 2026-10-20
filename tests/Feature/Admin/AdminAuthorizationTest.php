<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Event;
use App\Models\Story;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Role × endpoint matrix for /api/v1/admin. Each section is checked for read
 * and write access so that a missing gate on either is caught.
 */
class AdminAuthorizationTest extends AdminTestCase
{
    private const SECTIONS = [
        'dashboard' => ['admin/dashboard', null],
        'businesses' => ['admin/businesses', 'businesses'],
        'places' => ['admin/places', 'places'],
        'events' => ['admin/events', 'events'],
        'venues' => ['admin/venues', 'events'],
        'organizers' => ['admin/organizers', 'events'],
        'stories' => ['admin/stories', 'stories'],
        'collections' => ['admin/collections', 'collections'],
        'areas' => ['admin/areas', 'taxonomy'],
        'categories' => ['admin/categories', 'taxonomy'],
        'media' => ['admin/media', 'content'],
        'users' => ['admin/staff', 'users'],
        'members' => ['admin/members', 'users'],
        'audit-logs' => ['admin/audit-logs', 'audit'],
        'analytics' => ['admin/analytics', 'analytics'],
        'plans' => ['admin/plans', 'monetization'],
        'subscriptions' => ['admin/subscriptions', 'monetization'],
        'revenue' => ['admin/revenue', 'monetization'],
        'seo' => ['admin/seo', 'seo'],
        'seo-audit' => ['admin/seo/audit', 'seo'],
        'settings-seo' => ['admin/settings/seo', 'seo'],
        'settings-social' => ['admin/settings/social', 'settings'],
        'settings-tracking' => ['admin/settings/tracking', 'settings'],
    ];

    /** Which permission groups each role holds (mirrors RoleName::permissions()). */
    private const ACCESS = [
        'SUPER_ADMIN' => ['businesses', 'places', 'events', 'stories', 'collections', 'taxonomy', 'content', 'users', 'audit', 'analytics', 'monetization', 'seo', 'settings'],
        'ADMIN' => ['businesses', 'places', 'events', 'stories', 'collections', 'taxonomy', 'content', 'users', 'audit', 'analytics', 'monetization', 'seo', 'settings'],
        'EDITOR' => ['businesses', 'places', 'events', 'stories', 'collections', 'taxonomy', 'content', 'analytics', 'seo'],
        'MODERATOR' => [],
        'BUSINESS_OWNER' => null,
        'CONTRIBUTOR' => null,
        'USER' => null,
    ];

    public static function roles(): array
    {
        return collect(RoleName::cases())->mapWithKeys(fn (RoleName $r) => [$r->value => [$r]])->all();
    }

    public function test_guests_get_401_everywhere(): void
    {
        foreach (self::SECTIONS as [$uri]) {
            $this->getJson("/api/v1/{$uri}")->assertUnauthorized();
        }
        $this->postJson('/api/v1/admin/businesses', ['name' => 'X'])->assertUnauthorized();
        $this->postJson('/api/v1/admin/media')->assertUnauthorized();
    }

    #[DataProvider('roles')]
    public function test_listing_access_matches_role_permissions(RoleName $role): void
    {
        $this->actingAsRole($role);
        $groups = self::ACCESS[$role->value];

        foreach (self::SECTIONS as $name => [$uri, $group]) {
            $allowed = $groups !== null && ($group === null || in_array($group, $groups, true));
            $this->getJson("/api/v1/{$uri}")->assertStatus($allowed ? 200 : 403, "{$role->value} on {$name}");
        }
    }

    #[DataProvider('roles')]
    public function test_write_access_matches_role_permissions(RoleName $role): void
    {
        $this->actingAsRole($role);
        $groups = self::ACCESS[$role->value] ?? [];
        $can = fn (string $group) => in_array($group, $groups, true);

        $business = Business::factory()->create();
        $event = Event::factory()->create();
        $story = Story::factory()->create();

        $writes = [
            ['postJson', '/api/v1/admin/businesses', ['name' => 'Matrix Business'], 'businesses', 201],
            ['patchJson', "/api/v1/admin/businesses/{$business->id}", ['tagline' => 'Changed'], 'businesses', 200],
            ['postJson', "/api/v1/admin/businesses/{$business->id}/status", ['status' => 'UNDER_REVIEW'], 'businesses', 200],
            ['postJson', '/api/v1/admin/places', ['name' => 'Matrix Place'], 'places', 201],
            ['patchJson', "/api/v1/admin/events/{$event->id}", ['summary' => 'Changed'], 'events', 200],
            ['postJson', '/api/v1/admin/venues', ['name' => 'Matrix Venue'], 'events', 201],
            ['patchJson', "/api/v1/admin/stories/{$story->id}", ['excerpt' => 'Changed'], 'stories', 200],
            ['postJson', '/api/v1/admin/collections', ['title' => 'Matrix Collection'], 'collections', 201],
            ['postJson', '/api/v1/admin/areas', ['name' => 'Matrix Area'], 'taxonomy', 201],
            ['postJson', '/api/v1/admin/categories', ['name' => 'Matrix Cat', 'type' => 'business'], 'taxonomy', 201],
            ['putJson', '/api/v1/admin/settings/seo', ['site_name' => 'DoonPortal', 'title_template' => '%s | DoonPortal', 'home_title' => 'Home', 'home_description' => 'Home page', 'default_description' => 'Default', 'allow_indexing' => true], 'seo', 200],
            ['putJson', '/api/v1/admin/settings/tracking', ['ga4_measurement_id' => 'G-MATRIX12'], 'settings', 200],
            ['postJson', '/api/v1/admin/plans', ['name' => 'Matrix Plan', 'price_paise' => 49900, 'interval' => 'MONTH'], 'monetization', 201],
            ['deleteJson', "/api/v1/admin/businesses/{$business->id}", [], 'businesses', 204],
        ];

        foreach ($writes as [$method, $uri, $payload, $group, $okStatus]) {
            $this->{$method}($uri, $payload)->assertStatus($can($group) ? $okStatus : 403, "{$role->value} {$method} {$uri}");
        }

        if ($groups === [] || $groups === null) {
            $this->assertSame(0, AuditLog::count(), 'Forbidden requests must not change anything.');
        }
    }

    public function test_business_owner_cannot_use_admin_endpoints_for_their_own_listing(): void
    {
        $owner = $this->actingAsRole(RoleName::BusinessOwner);
        $business = Business::factory()->create();
        $business->forceFill(['owner_id' => $owner->id])->save();

        $this->patchJson("/api/v1/admin/businesses/{$business->id}", ['name' => 'Hijacked'])->assertForbidden();
        $this->postJson("/api/v1/admin/businesses/{$business->id}/status", ['status' => 'VERIFIED'])->assertForbidden();
        $this->assertNotSame('Hijacked', $business->fresh()->name);
    }

    public function test_admin_records_are_addressed_by_id_not_slug(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $business = Business::factory()->create();

        $this->getJson("/api/v1/admin/businesses/{$business->slug}")->assertNotFound();
        $this->getJson("/api/v1/admin/businesses/{$business->id}")->assertOk()->assertJsonPath('data.id', $business->id);
    }
}
