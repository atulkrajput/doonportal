<?php

namespace Tests\Feature\DataEngine;

use App\Enums\BusinessStatus;
use App\Enums\RoleName;
use App\Models\AiDiscovery;
use App\Models\AiRun;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Category;
use App\Models\Setting;
use App\Services\AI\AiSettings;
use Database\Seeders\AreaSeeder;
use Database\Seeders\CategorySeeder;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Feature\Admin\AdminTestCase;

class DiscoveryTest extends AdminTestCase
{
    /** @var list<array<string, mixed>> */
    private array $osmElements = [];

    /** @var list<array<string, mixed>> */
    private array $webResults = [];

    /** @var array<string, mixed> */
    private array $extraction = ['businesses' => []];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([CategorySeeder::class, AreaSeeder::class]);
        config([
            'ai.default' => 'groq',
            'discovery.pause_ms' => 0,
            'discovery.categories' => [
                'cafes' => ['osm' => ['amenity=cafe'], 'search' => 'cafes'],
                'clinics' => ['osm' => ['amenity=clinic'], 'search' => 'clinics'],
            ],
        ]);

        Http::fake([
            // Answer each category's query with the elements carrying its tag.
            'overpass-api.de/*' => fn (Request $r) => Http::response(['elements' => array_values(array_filter(
                $this->osmElements, fn ($e) => str_contains($r['data'], '"amenity"="'.$e['tags']['amenity'].'"')
            ))]),
            'api.tavily.com/*' => fn () => Http::response(['results' => $this->webResults]),
            'api.groq.com/*' => fn (Request $r) => $this->groqReply($r),
        ]);
    }

    private function groqReply(Request $request)
    {
        $system = $request['messages'][0]['content'];
        if (str_contains($system, 'extract real local businesses')) {
            $payload = $this->extraction;
        } else {
            $facts = json_decode(substr($request['messages'][1]['content'], strpos($request['messages'][1]['content'], '[')), true);
            $payload = ['items' => array_map(fn ($f) => ['id' => $f['id'], 'description' => "{$f['name']} is a cafe in Dehradun.", 'confidence' => 0.9, 'flags' => []], $facts)];
        }

        return Http::response([
            'model' => 'llama-test',
            'choices' => [['message' => ['content' => json_encode($payload)]]],
            'usage' => ['prompt_tokens' => 100, 'completion_tokens' => 50],
        ]);
    }

    private function cafe(int $id, string $name, array $tags = [], float $lat = 30.33, float $lon = 78.05): array
    {
        return ['type' => 'node', 'id' => $id, 'lat' => $lat, 'lon' => $lon, 'tags' => ['amenity' => 'cafe', 'name' => $name, ...$tags]];
    }

    private function configure(array $values = []): void
    {
        app(AiSettings::class)->update(array_merge([
            'provider' => 'groq', 'groq_model' => 'llama-test', 'openai_model' => 'gpt-4o-mini',
            'discovery_enabled' => true, 'per_category_limit' => 2, 'use_web_search' => true,
            'groq_api_key' => 'gsk_secret_value_1234',
        ], $values));
    }

    public function test_settings_keep_keys_secret_and_only_admins_manage_them(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $this->getJson('/api/v1/admin/ai/settings')->assertForbidden();

        $this->actingAsRole(RoleName::Admin);
        $payload = ['provider' => 'openai', 'groq_model' => 'llama-3.3-70b-versatile', 'openai_model' => 'gpt-4o-mini', 'discovery_enabled' => true,
            'per_category_limit' => 5, 'use_web_search' => true, 'openai_api_key' => 'sk-live-abcdefgh9876', 'tavily_api_key' => 'tvly-xyz-4321'];

        $this->putJson('/api/v1/admin/ai/settings', $payload)->assertOk()
            ->assertJsonPath('data.provider', 'openai')
            ->assertJsonPath('data.keys.openai_api_key.set', true)
            ->assertJsonPath('data.keys.openai_api_key.hint', '…9876')
            ->assertJsonMissing(['sk-live-abcdefgh9876']);

        $stored = Setting::where('group', 'ai')->value('value');
        $this->assertNotSame('sk-live-abcdefgh9876', $stored['openai_api_key'], 'keys are encrypted at rest');
        $this->assertStringNotContainsString('sk-live', json_encode(AuditLog::pluck('new_values')));

        // Blank keeps the saved key; "clear" removes it.
        $this->putJson('/api/v1/admin/ai/settings', [...$payload, 'openai_api_key' => '', 'clear' => ['tavily_api_key']])->assertOk()
            ->assertJsonPath('data.keys.openai_api_key.set', true)
            ->assertJsonPath('data.keys.tavily_api_key.set', false);
        $this->assertSame('sk-live-abcdefgh9876', app(AiSettings::class)->get('openai_api_key'));

        $this->putJson('/api/v1/admin/ai/settings', [...$payload, 'per_category_limit' => 50])->assertUnprocessable()->assertJsonValidationErrors('per_category_limit');
    }

    public function test_daily_run_queues_new_osm_businesses_up_to_the_limit(): void
    {
        $this->configure(['use_web_search' => false]);
        Business::factory()->create(['name' => 'Old Town Cafe', 'latitude' => 30.3301, 'longitude' => 78.0501, 'phone' => null]);
        Business::factory()->create(['name' => 'Different Name', 'phone' => '+91 98765 11111']);
        AiDiscovery::forceCreate(['source' => 'osm', 'external_id' => 'node/5', 'name' => 'Seen Before', 'data' => [], 'status' => 'REJECTED']);

        $this->osmElements = [
            $this->cafe(1, 'Old Town Cafe'),                                    // already listed nearby
            $this->cafe(2, 'Same Phone Cafe', ['phone' => '+91 98765 11111']),  // already listed (phone)
            $this->cafe(5, 'Seen Before'),                                      // already reviewed
            $this->cafe(3, 'Hillside Brew', ['opening_hours' => 'Mo-Sa 09:00-21:00; Su off', 'addr:street' => 'Rajpur Road', 'phone' => '098765 43210', 'internet_access' => 'wlan']),
            $this->cafe(4, 'Doon Beans', [], 30.31, 78.02),
            $this->cafe(6, 'Third New Cafe', [], 30.35, 78.07),
        ];

        $this->artisan('doon:discover --scheduled')->assertSuccessful();

        $run = AiRun::sole();
        $this->assertSame(AiRun::COMPLETED, $run->status);
        $this->assertSame(2, $run->found_count, 'limit of 2 per category');
        $this->assertSame(150, $run->ai_tokens, 'one AI call: the descriptions');

        $queued = AiDiscovery::where('status', 'PENDING')->get();
        $this->assertCount(2, $queued);
        $this->assertEmpty(array_intersect(['Old Town Cafe', 'Same Phone Cafe', 'Seen Before'], $queued->pluck('name')->all()));
        $this->assertSame(0, Business::where('name', 'Hillside Brew')->count(), 'nothing is published before review');

        // The next night picks up the one new cafe left; queued ones are never repeated.
        $this->artisan('doon:discover --scheduled')->assertSuccessful();
        $this->assertSame(3, AiDiscovery::where('status', 'PENDING')->count());
        $this->assertSame(1, AiRun::latest('created_at')->orderByDesc('id')->first()->found_count);

        $hillside = AiDiscovery::firstWhere('name', 'Hillside Brew');
        $this->assertSame('+919876543210', $hillside->data['phone']);
        $this->assertSame(['Wi-Fi'], $hillside->data['amenities']);
        $this->assertCount(7, $hillside->data['hours']);
        $this->assertSame('Hillside Brew is a cafe in Dehradun.', $hillside->data['description']);
        $this->assertSame('https://www.openstreetmap.org/node/3', $hillside->evidence['url']);
        $this->assertSame(0.9, $hillside->ai['confidence']);
    }

    public function test_switched_off_skips_the_nightly_run_and_without_ai_osm_still_works(): void
    {
        $this->configure(['discovery_enabled' => false, 'groq_api_key' => null, 'use_web_search' => false]);
        $this->osmElements = [$this->cafe(1, 'Plain Cafe')];

        $this->artisan('doon:discover --scheduled')->assertSuccessful();
        $this->assertSame(0, AiRun::count());

        // A manual run still works; without an AI key items are queued with no description.
        $this->artisan('doon:discover')->assertSuccessful();
        $this->assertNull(AiDiscovery::sole()->data['description']);
        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'groq'));
    }

    public function test_web_search_only_keeps_names_the_pages_actually_contain(): void
    {
        $this->configure(['tavily_api_key' => 'tvly-test-key']);
        $this->osmElements = [];
        $this->webResults = [
            ['title' => 'Best cafes in Dehradun', 'url' => 'https://dehradunblog.example/cafes', 'content' => 'We loved Rooftop Chai House on Rajpur Road, call 98123 45678. Also try the riverside spot.'],
            ['title' => 'Cafes', 'url' => 'https://www.justdial.com/Dehradun/cafes', 'content' => 'Directory Cafe'],
        ];
        $this->extraction = ['businesses' => [
            ['name' => 'Rooftop Chai House', 'source_id' => 1, 'address' => 'Rajpur Road', 'phone' => '98123 45678', 'website' => 'https://rooftopchai.example'],
            ['name' => 'Invented Cafe', 'source_id' => 1, 'address' => null, 'phone' => null, 'website' => null],
            ['name' => 'Directory Cafe', 'source_id' => 2, 'address' => null, 'phone' => null, 'website' => null],
        ]];

        $this->artisan('doon:discover --category=cafes')->assertSuccessful();

        $found = AiDiscovery::sole();
        $this->assertSame('Rooftop Chai House', $found->name);
        $this->assertSame('web', $found->source);
        $this->assertSame('+919812345678', $found->data['phone']);
        $this->assertNull($found->data['website'], 'a website the page does not mention is dropped');
        $this->assertSame('https://dehradunblog.example/cafes', $found->evidence['url']);
    }

    public function test_approval_publishes_an_unverified_listing_credited_to_its_source(): void
    {
        $this->configure(['use_web_search' => false]);
        $this->osmElements = [$this->cafe(3, 'Hillside Brew', ['opening_hours' => 'Mo-Fr 10:00-13:00,14:00-18:00', 'addr:street' => 'Rajpur Road', 'addr:postcode' => '248001'])];
        $this->artisan('doon:discover --category=cafes')->assertSuccessful();
        $discovery = AiDiscovery::sole();

        $this->actingAsRole(RoleName::Moderator);
        $this->getJson('/api/v1/admin/ai/discoveries')->assertForbidden();

        $this->actingAsRole(RoleName::Admin);
        $this->getJson('/api/v1/admin/ai/discoveries')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('counts.PENDING', 1);
        $this->patchJson("/api/v1/admin/ai/discoveries/{$discovery->id}", ['name' => 'Hillside Brew Co.', 'phone' => '+91 135 271 1234'])->assertOk();
        $this->postJson("/api/v1/admin/ai/discoveries/{$discovery->id}/approve")->assertOk()->assertJsonPath('data.status', 'APPROVED');

        $business = Business::firstWhere('name', 'Hillside Brew Co.');
        $this->assertTrue($business->is_published);
        $this->assertSame(BusinessStatus::Unverified, $business->status, 'never verified because a machine found it');
        $this->assertSame('OpenStreetMap contributors', $business->source_name);
        $this->assertSame('https://www.openstreetmap.org/node/3', $business->source_url);
        $this->assertSame('+91 135 271 1234', $business->phone);
        $this->assertSame('Rajpur Road', $business->primaryArea?->name);
        $this->assertSame([Category::firstWhere('slug', 'cafes')->id], $business->categories()->pluck('categories.id')->all());
        $this->assertSame(10, $business->hours()->count(), 'two slots on five days');
        $this->assertNotNull($this->lastAudit('ai_discovery.approved'));

        $this->postJson("/api/v1/admin/ai/discoveries/{$discovery->id}/approve")->assertUnprocessable();
    }

    public function test_bulk_review_and_run_now(): void
    {
        $this->configure(['use_web_search' => false, 'groq_api_key' => null]);
        $this->osmElements = [$this->cafe(1, 'Cafe One'), $this->cafe(2, 'Cafe Two', [], 30.36, 78.08)];
        $this->artisan('doon:discover --category=cafes')->assertSuccessful();
        [$a, $b] = AiDiscovery::orderBy('name')->get()->all();

        $this->actingAsRole(RoleName::Admin);
        $this->postJson('/api/v1/admin/ai/discoveries/bulk', ['action' => 'approve', 'ids' => [$a->id]])->assertOk()->assertJsonPath('data.done', 1);
        $this->postJson("/api/v1/admin/ai/discoveries/{$b->id}/reject", ['duplicate_of_id' => Business::firstWhere('name', 'Cafe One')->id])->assertOk()->assertJsonPath('data.status', 'DUPLICATE');

        // Run now is queued, then carried out by the scheduler's --queued check.
        $this->postJson('/api/v1/admin/ai/runs', ['category_slug' => 'cafes'])->assertCreated()->assertJsonPath('data.status', 'queued');
        $this->postJson('/api/v1/admin/ai/runs')->assertUnprocessable();
        $this->osmElements = [$this->cafe(9, 'Cafe Nine', [], 30.40, 78.10)];
        $this->artisan('doon:discover --queued')->assertSuccessful();
        $this->assertSame(AiRun::COMPLETED, AiRun::latest('created_at')->first()->status);
        $this->assertTrue(AiDiscovery::where('name', 'Cafe Nine')->exists());
        $this->getJson('/api/v1/admin/ai/runs')->assertOk()->assertJsonPath('data.0.found_count', 1);
    }

    public function test_one_osm_request_per_run_with_fallback_to_a_mirror(): void
    {
        $this->configure(['use_web_search' => false, 'groq_api_key' => null]);
        $mirrorCalls = 0;
        Http::swap(new Factory);
        Http::fake([
            'overpass-api.de/*' => Http::response('busy', 502),
            'overpass.private.coffee/*' => function () use (&$mirrorCalls) {
                $mirrorCalls++;

                return Http::response(['elements' => [
                    $this->cafe(1, 'Mirror Cafe'),
                    ['type' => 'node', 'id' => 2, 'lat' => 30.3, 'lon' => 78.0, 'tags' => ['amenity' => 'clinic', 'name' => 'Mirror Clinic']],
                ]]);
            },
        ]);

        $this->artisan('doon:discover')->assertSuccessful();

        $this->assertSame(1, $mirrorCalls, 'both categories come from a single request');
        $this->assertSame(['Mirror Cafe', 'Mirror Clinic'], AiDiscovery::orderBy('name')->pluck('name')->all());
        $this->assertSame('cafes', AiDiscovery::firstWhere('name', 'Mirror Cafe')->category->slug);
    }

    public function test_osm_outage_is_recorded_and_the_run_still_completes(): void
    {
        $this->configure(['use_web_search' => false, 'groq_api_key' => null]);
        Http::swap(new Factory);
        Http::fake(['*' => Http::response('busy', 504)]);

        $this->artisan('doon:discover')->assertSuccessful();

        $run = AiRun::sole();
        $this->assertSame(AiRun::COMPLETED, $run->status);
        $this->assertStringContainsString('OpenStreetMap servers are busy', $run->stats['cafes']['errors'][0]);
    }

    public function test_healthcare_finds_are_flagged_for_careful_review(): void
    {
        $this->configure(['use_web_search' => false, 'groq_api_key' => null]);
        $this->osmElements = [['type' => 'way', 'id' => 77, 'center' => ['lat' => 30.32, 'lon' => 78.04], 'tags' => ['amenity' => 'clinic', 'name' => 'Doon Family Clinic']]];

        $this->artisan('doon:discover --category=clinics')->assertSuccessful();

        $clinic = AiDiscovery::sole();
        $this->assertSame('way/77', $clinic->external_id);
        $this->assertSame(['healthcare'], $clinic->ai['flags']);
        $this->assertSame(30.32, $clinic->data['latitude']);
    }
}
