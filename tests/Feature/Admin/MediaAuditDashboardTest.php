<?php

namespace Tests\Feature\Admin;

use App\Enums\RoleName;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Media;
use App\Models\Review;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaAuditDashboardTest extends AdminTestCase
{
    /** A valid 1×1 PNG, so tests do not need the GD extension. */
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    /**
     * A real (not faked) upload, so the MIME type is detected from the bytes.
     */
    private function upload(string $contents, string $clientName, string $clientMime): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'upl');
        file_put_contents($path, $contents);

        return new UploadedFile($path, $clientName, $clientMime, null, true);
    }

    public function test_image_upload_is_stored_with_a_server_chosen_name_and_audited(): void
    {
        Storage::fake('public');
        $editor = $this->actingAsRole(RoleName::Editor);

        $response = $this->post('/api/v1/admin/media', [
            'file' => $this->upload(base64_decode(self::PNG), '../../evil name.php.png', 'image/png'),
            'alt_text' => 'A test pixel',
        ], ['Accept' => 'application/json'])->assertCreated()
            ->assertJsonPath('data.mime_type', 'image/png')
            ->assertJsonPath('data.width', 1)
            ->assertJsonPath('data.alt_text', 'A test pixel');

        $media = Media::findOrFail($response->json('data.id'));
        $this->assertMatchesRegularExpression('#^media/\d{4}/\d{2}/[0-9a-z]{26}\.png$#', $media->path);
        Storage::disk('public')->assertExists($media->path);
        $this->assertSame($editor->id, $media->uploaded_by);
        $this->assertNotNull($this->lastAudit('media.uploaded'));

        $this->patchJson("/api/v1/admin/media/{$media->id}", ['alt_text' => 'Better alt'])->assertOk();
        $this->assertSame(['alt_text' => 'A test pixel'], $this->lastAudit('media.updated')->old_values);
    }

    public function test_dangerous_or_oversized_uploads_are_rejected(): void
    {
        Storage::fake('public');
        $this->actingAsRole(RoleName::Editor);

        $cases = [
            'php disguised as jpeg' => $this->upload('<?php echo "pwned"; ?>', 'photo.jpg', 'image/jpeg'),
            'svg with script' => $this->upload('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'logo.svg', 'image/svg+xml'),
            'html' => $this->upload('<html><body>hi</body></html>', 'page.png', 'image/png'),
            'too large' => UploadedFile::fake()->create('big.png', 6000, 'image/png'),
        ];

        foreach ($cases as $label => $file) {
            $this->post('/api/v1/admin/media', ['file' => $file], ['Accept' => 'application/json'])
                ->assertUnprocessable()->assertJsonValidationErrors('file', 'errors', $label);
        }

        $this->assertSame(0, Media::count());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_media_upload_requires_a_content_permission(): void
    {
        Storage::fake('public');
        $this->actingAsRole(RoleName::Moderator);

        $this->post('/api/v1/admin/media', ['file' => $this->upload(base64_decode(self::PNG), 'a.png', 'image/png')], ['Accept' => 'application/json'])
            ->assertForbidden();
    }

    public function test_audit_log_listing_and_filters(): void
    {
        $admin = $this->actingAsRole(RoleName::Admin);
        $business = Business::factory()->create();
        $this->patchJson("/api/v1/admin/businesses/{$business->id}", ['name' => 'Renamed'])->assertOk();
        $this->postJson("/api/v1/admin/businesses/{$business->id}/status", ['status' => 'UNDER_REVIEW'])->assertOk();
        $this->postJson('/api/v1/admin/areas', ['name' => 'Audit Area'])->assertCreated();

        $this->getJson('/api/v1/admin/audit-logs')->assertOk()->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.action', 'area.created')
            ->assertJsonPath('data.0.actor.id', $admin->id);
        $this->getJson('/api/v1/admin/audit-logs?action=business.')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/admin/audit-logs?action=business.status_changed')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/admin/audit-logs?auditable_type=business&auditable_id={$business->id}")->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/admin/audit-logs?action=x%25')->assertUnprocessable();
        $this->getJson('/api/v1/admin/audit-logs?auditable_type=App%5CModels%5CUser')->assertUnprocessable();
        $this->getJson('/api/v1/admin/audit-logs?from='.now('Asia/Kolkata')->addDay()->format('Y-m-d'))->assertOk()->assertJsonCount(0, 'data');

        // The trail is read-only.
        $id = AuditLog::first()->id;
        $this->deleteJson("/api/v1/admin/audit-logs/{$id}")->assertNotFound();
    }

    public function test_dashboard_sections_follow_permissions(): void
    {
        Business::factory()->count(2)->create();
        Review::factory()->create(['status' => 'PENDING']);

        $this->actingAsRole(RoleName::Editor);
        $editor = $this->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');
        $this->assertSame(Business::count(), $editor['businesses']['total']);
        $this->assertArrayHasKey('events', $editor);
        $this->assertArrayNotHasKey('users', $editor);
        $this->assertArrayNotHasKey('moderation', $editor);
        $this->assertArrayNotHasKey('recent_activity', $editor);

        $this->actingAsRole(RoleName::Moderator);
        $moderator = $this->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');
        $this->assertSame(['moderation'], array_keys($moderator));
        $this->assertSame(1, $moderator['moderation']['reviews_pending']);

        $this->actingAsRole(RoleName::Admin);
        $admin = $this->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');
        $this->assertArrayHasKey('users', $admin);
        $this->assertArrayHasKey('recent_activity', $admin);
    }
}
