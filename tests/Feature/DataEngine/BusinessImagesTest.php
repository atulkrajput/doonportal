<?php

namespace Tests\Feature\DataEngine;

use App\Enums\RoleName;
use App\Models\AiDiscovery;
use App\Models\Business;
use App\Models\Category;
use App\Models\Media;
use App\Services\BusinessImages\BusinessImageStore;
use App\Services\BusinessImages\SafeUrl;
use App\Services\DataEngine\ImageFinder;
use Database\Seeders\CategorySeeder;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Admin\AdminTestCase;

class BusinessImagesTest extends AdminTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        // Every test host resolves to a public address, except the ones named "internal".
        SafeUrl::$resolver = fn (string $host) => str_contains($host, 'internal') ? ['10.0.0.7'] : ['93.184.216.34'];
    }

    protected function tearDown(): void
    {
        SafeUrl::$resolver = null;
        parent::tearDown();
    }

    /**
     * A real PNG of the given size (grey), built without GD.
     */
    public static function png(int $width, int $height): string
    {
        $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $raw = str_repeat("\0".str_repeat("\x99\x99\x99", $width), $height);

        return "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0))
            .$chunk('IDAT', gzcompress($raw))
            .$chunk('IEND', '');
    }

    public function test_only_public_addresses_are_fetched(): void
    {
        $this->assertTrue(SafeUrl::isFetchable('https://cafe.example/logo.png'));
        foreach (['http://127.0.0.1/x', 'http://10.1.2.3/a', 'https://internal.example/x', 'ftp://cafe.example/a', 'https://user:pw@cafe.example/', 'https://cafe.example:8080/a', 'javascript:alert(1)'] as $url) {
            $this->assertFalse(SafeUrl::isFetchable($url), $url);
        }
    }

    public function test_finder_prefers_licensed_commons_photos_then_the_business_website(): void
    {
        Http::fake([
            'commons.wikimedia.org/*' => Http::response(['query' => ['pages' => ['1' => ['imageinfo' => [[
                'thumburl' => 'https://upload.wikimedia.org/thumb/clock.jpg',
                'descriptionurl' => 'https://commons.wikimedia.org/wiki/File:Clock.jpg',
                'extmetadata' => ['Artist' => ['value' => '<a href="/u">Asha R</a>'], 'LicenseShortName' => ['value' => 'CC BY-SA 4.0']],
            ]]]]]]),
            'hillside.example/*' => Http::response('<html><head><meta content="/img/share.jpg" property="og:image"></head></html>'),
            'internal.example/*' => Http::response('<meta property="og:image" content="https://cdn.example/x.jpg">'),
        ]);
        $finder = app(ImageFinder::class);

        $commons = $finder->find(['source' => 'osm', 'name' => 'Clock Tower Cafe', 'data' => ['website' => 'https://hillside.example'], 'evidence' => ['tags' => ['wikimedia_commons' => 'File:Clock.jpg']]]);
        $this->assertSame('wikimedia', $commons['source']);
        $this->assertSame('Photo: Asha R, CC BY-SA 4.0 via Wikimedia Commons', $commons['credit']);

        $site = $finder->find(['source' => 'osm', 'name' => 'Hillside', 'data' => ['website' => 'https://hillside.example/'], 'evidence' => ['tags' => []]]);
        $this->assertSame('https://hillside.example/img/share.jpg', $site['url'], 'relative share image resolved');
        $this->assertSame("Photo: from the business's website (hillside.example)", $site['credit']);

        $this->assertNull($finder->find(['source' => 'web', 'name' => 'X', 'data' => ['website' => 'https://internal.example'], 'evidence' => []]), 'private address never fetched');
        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'internal.example'));
    }

    public function test_approving_a_discovery_saves_its_image_as_the_cover_in_the_businesses_folder(): void
    {
        $this->seed(CategorySeeder::class);
        Http::fake(['cdn.example/*' => Http::response(self::png(400, 300), 200, ['Content-Type' => 'image/png'])]);
        $discovery = AiDiscovery::forceCreate([
            'source' => 'osm', 'external_id' => 'node/1', 'name' => 'Picture Cafe', 'status' => 'PENDING',
            'category_id' => Category::firstWhere('slug', 'cafes')->id,
            'data' => ['image' => ['url' => 'https://cdn.example/cafe.png', 'source' => 'website', 'credit' => "Photo: from the business's website (cafe.example)"]],
            'evidence' => ['url' => 'https://www.openstreetmap.org/node/1'],
        ]);
        $this->actingAsRole(RoleName::Admin);

        $this->postJson("/api/v1/admin/ai/discoveries/{$discovery->id}/approve")->assertOk();

        $business = Business::with('cover')->firstWhere('name', 'Picture Cafe');
        $this->assertNotNull($business->cover);
        $this->assertMatchesRegularExpression('#^businesses/'.$business->id.'_cover-[a-z0-9]{6}\.(png|jpg|webp)$#', $business->cover->path);
        Storage::disk('public')->assertExists($business->cover->path);
        $this->assertSame("Photo: from the business's website (cafe.example)", $business->cover->credit);
        $this->getJson("/api/v1/businesses/{$business->slug}")->assertJsonPath('data.cover.credit', "Photo: from the business's website (cafe.example)");
    }

    public function test_a_broken_image_never_blocks_approval_and_staff_can_drop_or_replace_it(): void
    {
        $this->seed(CategorySeeder::class);
        Http::fake(['cdn.example/*' => Http::response('<html>not an image</html>', 200, ['Content-Type' => 'image/png'])]);
        $cafes = Category::firstWhere('slug', 'cafes')->id;
        $make = fn (string $id, string $name) => AiDiscovery::forceCreate([
            'source' => 'osm', 'external_id' => $id, 'name' => $name, 'status' => 'PENDING', 'category_id' => $cafes,
            'data' => ['image' => ['url' => 'https://cdn.example/fake.png', 'source' => 'website', 'credit' => 'x']], 'evidence' => [],
        ]);
        $broken = $make('node/2', 'Broken Image Cafe');
        $dropped = $make('node/3', 'No Image Cafe');
        $this->actingAsRole(RoleName::Admin);

        $this->postJson("/api/v1/admin/ai/discoveries/{$broken->id}/approve")->assertOk();
        $this->assertNull(Business::firstWhere('name', 'Broken Image Cafe')->cover_media_id);
        $this->assertStringContainsString('Image not added', $broken->fresh()->review_notes);

        $this->patchJson("/api/v1/admin/ai/discoveries/{$dropped->id}", ['remove_image' => true])->assertOk()->assertJsonPath('data.data.image', null);
        $this->patchJson("/api/v1/admin/ai/discoveries/{$dropped->id}", ['image_url' => 'https://staff.example/pic.jpg', 'image_credit' => 'Photo: owner'])->assertOk()
            ->assertJsonPath('data.data.image.source', 'staff')->assertJsonPath('data.data.image.credit', 'Photo: owner');
    }

    public function test_owner_uploads_go_live_only_after_staff_approve_the_change(): void
    {
        $owner = $this->userWithRole(RoleName::BusinessOwner);
        $business = Business::factory()->create();
        $business->forceFill(['owner_id' => $owner->id])->save();
        $other = Business::factory()->create();
        Sanctum::actingAs($owner);

        $upload = fn (string $kind, string $bytes, string $name = 'pic.png') => $this->post("/api/v1/me/businesses/{$business->id}/images",
            ['kind' => $kind, 'file' => UploadedFile::fake()->createWithContent($name, $bytes)], ['Accept' => 'application/json']);

        $upload('cover', 'not really a png')->assertUnprocessable()->assertJsonValidationErrors('file');
        $upload('cover', self::png(60, 60))->assertUnprocessable()->assertJsonValidationErrors('file'); // too small
        $cover = $upload('cover', self::png(800, 450))->assertCreated()->json('data');
        $photo = $upload('photo', self::png(640, 480))->assertCreated()->json('data');
        $this->assertStringStartsWith('/storage/businesses/'.$business->id.'_cover-', parse_url($cover['url'], PHP_URL_PATH));

        // Another business's image can't be used.
        $foreign = app(BusinessImageStore::class)->storeUpload(UploadedFile::fake()->createWithContent('f.png', self::png(300, 300)), $other, 'logo');
        $this->postJson("/api/v1/me/businesses/{$business->id}/edits", ['logo_media_id' => $foreign->id])
            ->assertUnprocessable()->assertJsonValidationErrors('logo_media_id');

        $id = $this->postJson("/api/v1/me/businesses/{$business->id}/edits", [
            'cover_media_id' => $cover['id'],
            'photos' => [['media_id' => $photo['id'], 'caption' => 'Our counter']],
        ])->assertCreated()->json('data.id');
        $this->assertNull($business->fresh()->cover_media_id, 'nothing changes before approval');
        $this->getJson("/api/v1/me/businesses/{$business->id}")->assertJsonPath("data.media.{$cover['id']}", $cover['url']);

        $this->actingAsRole(RoleName::Moderator);
        $this->getJson("/api/v1/admin/submissions/{$id}")->assertJsonPath("data.context.media.{$photo['id']}", $photo['url']);
        $this->postJson("/api/v1/admin/submissions/{$id}/approve")->assertOk();

        $this->assertSame($cover['id'], $business->fresh()->cover_media_id);
        $this->getJson("/api/v1/businesses/{$business->slug}/photos")->assertOk()
            ->assertJsonPath('data.0.caption', 'Our counter')
            ->assertJsonPath('data.0.media.url', $photo['url']);
    }

    public function test_backfill_adds_covers_to_businesses_without_one(): void
    {
        Http::fake([
            'withsite.example/share.png' => Http::response(self::png(500, 300), 200, ['Content-Type' => 'image/png']),
            'withsite.example/*' => Http::response('<meta property="og:image" content="https://withsite.example/share.png">'),
        ]);
        $withSite = Business::factory()->create(['website' => 'https://withsite.example/']);
        $noSite = Business::factory()->create(['website' => null]);

        $this->artisan('doon:business-images --dry-run')->assertSuccessful();
        $this->assertNull($withSite->fresh()->cover_media_id);

        $this->artisan('doon:business-images')->assertSuccessful();
        $cover = Media::find($withSite->fresh()->cover_media_id);
        $this->assertNotNull($cover);
        $this->assertStringStartsWith("businesses/{$withSite->id}_cover-", $cover->path);
        $this->assertNull($noSite->fresh()->cover_media_id);
    }
}
