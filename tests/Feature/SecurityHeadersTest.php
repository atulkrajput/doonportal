<?php

namespace Tests\Feature;

use App\Enums\RoleName;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_spa_pages_send_security_headers_and_a_nonce_based_report_only_csp(): void
    {
        $response = $this->get('/')->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeaderMissing('Content-Security-Policy')
            ->assertHeaderMissing('Strict-Transport-Security');

        $permissions = $response->headers->get('Permissions-Policy');
        $this->assertStringContainsString('camera=()', $permissions);
        $this->assertStringContainsString('microphone=()', $permissions);
        $this->assertStringContainsString('geolocation=(self)', $permissions);

        $csp = $response->headers->get('Content-Security-Policy-Report-Only');
        $nonce = Vite::cspNonce();
        $this->assertNotEmpty($nonce);
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertMatchesRegularExpression("/script-src 'self' 'nonce-".preg_quote($nonce, '/')."' /", $csp);
        $this->assertStringNotContainsString("'unsafe-eval'", $csp);
        $this->assertStringContainsString('https://fonts.googleapis.com', $csp);
        $this->assertStringContainsString('font-src \'self\' data: https://fonts.gstatic.com', $csp);
        foreach (['https://www.googletagmanager.com', 'https://*.clarity.ms', 'https://connect.facebook.net'] as $host) {
            $this->assertMatchesRegularExpression('/script-src [^;]*'.preg_quote($host, '/').'/', $csp);
        }
        foreach (['https://*.google-analytics.com', 'https://*.clarity.ms', 'https://www.facebook.com'] as $host) {
            $this->assertMatchesRegularExpression('/connect-src [^;]*'.preg_quote($host, '/').'/', $csp);
        }

        // The nonce reaches the page so Vite's dev client and consent.js can reuse it.
        $response->assertSee('<meta property="csp-nonce" nonce="'.$nonce.'">', false);
    }

    public function test_csp_is_enforced_when_configured(): void
    {
        config(['security.csp.enforce' => true, 'security.csp.report_uri' => '/csp-report']);

        $response = $this->get('/')->assertOk()->assertHeaderMissing('Content-Security-Policy-Report-Only');

        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringEndsWith('report-uri /csp-report', $csp);
    }

    public function test_hsts_is_sent_on_secure_requests_only(): void
    {
        $this->get('https://localhost/')->assertOk()->assertHeader('Strict-Transport-Security', 'max-age=31536000');
        $this->get('http://localhost/')->assertOk()->assertHeaderMissing('Strict-Transport-Security');
    }

    public function test_hsts_is_sent_in_production(): void
    {
        $this->app['env'] = 'production';

        $this->get('http://localhost/')->assertOk()->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    public function test_api_responses_get_security_headers_and_a_deny_all_csp(): void
    {
        $this->getJson('/api/v1/categories')->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
            ->assertHeaderMissing('Content-Security-Policy-Report-Only');
    }

    public function test_api_errors_still_carry_the_headers(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }

    public function test_admin_pages_still_render_with_the_headers(): void
    {
        $this->seed(RolePermissionSeeder::class);
        Sanctum::actingAs(User::factory()->create()->assignRole(RoleName::User, RoleName::Admin));

        foreach (['/admin', '/admin/settings'] as $path) {
            $this->get($path)->assertOk()
                ->assertSee('<div id="app"></div>', false)
                ->assertHeader('X-Content-Type-Options', 'nosniff')
                ->assertHeader('Content-Security-Policy-Report-Only');
        }

        $this->getJson('/api/v1/admin/dashboard')->assertOk()
            ->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }

    public function test_cors_only_allows_the_app_origin(): void
    {
        $origin = rtrim(config('app.url'), '/');

        $this->getJson('/api/v1/categories', ['Origin' => $origin])
            ->assertHeader('Access-Control-Allow-Origin', $origin);

        // With a single allowed origin the header always names it, so the browser rejects any other origin.
        $response = $this->getJson('/api/v1/categories', ['Origin' => 'https://evil.example']);
        $this->assertNotSame('https://evil.example', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotSame('*', $response->headers->get('Access-Control-Allow-Origin'));
    }
}
