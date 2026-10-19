<?php

namespace Tests\Feature\Admin;

use App\Enums\PublicationStatus;
use App\Enums\RoleName;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Place;
use App\Models\Story;

/**
 * Places, stories, collections and taxonomy.
 */
class EditorialAdminTest extends AdminTestCase
{
    public function test_story_body_is_sanitized_server_side(): void
    {
        $editor = $this->actingAsRole(RoleName::Editor);
        $business = Business::factory()->create();

        $id = $this->postJson('/api/v1/admin/stories', [
            'title' => 'A Test Walk',
            'type' => 'GUIDE',
            'body' => '<h2 onclick="steal()">Start</h2><script>alert(1)</script><p style="color:red">Walk <a href="javascript:alert(1)">here</a> '
                .'and <a href="https://example.test/x">there</a>.</p><iframe src="https://evil.test"></iframe><img src="x" onerror="alert(1)">',
            'linked_entities' => [['type' => 'business', 'id' => $business->id]],
        ])->assertCreated()->json('data.id');

        $story = Story::findOrFail($id);
        $this->assertSame($editor->id, $story->author_id);
        $this->assertStringNotContainsString('<script', $story->body);
        $this->assertStringNotContainsString('onclick', $story->body);
        $this->assertStringNotContainsString('onerror', $story->body);
        $this->assertStringNotContainsString('javascript:', $story->body);
        $this->assertStringNotContainsString('<iframe', $story->body);
        $this->assertStringNotContainsString('style=', $story->body);
        $this->assertStringContainsString('<h2>Start</h2>', $story->body);
        $this->assertStringContainsString('href="https://example.test/x"', $story->body);
        $this->assertStringContainsString('rel="noopener noreferrer nofollow"', $story->body);
        $this->assertSame(1, $story->reading_minutes);
        $this->assertSame(1, $story->entityLinks()->count());
    }

    public function test_story_publication_workflow(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $story = Story::factory()->create(['status' => 'DRAFT', 'body' => null, 'published_at' => null]);
        $url = "/api/v1/admin/stories/{$story->id}/status";

        $this->postJson($url, ['status' => 'PUBLISHED'])->assertStatus(409);
        $this->patchJson("/api/v1/admin/stories/{$story->id}", ['body' => '<p>Real words here.</p>'])->assertOk();
        $this->postJson($url, ['status' => 'PUBLISHED'])->assertOk()->assertJsonPath('data.status', 'PUBLISHED');
        $this->getJson("/api/v1/stories/{$story->slug}")->assertOk();

        $this->postJson($url, ['status' => 'ARCHIVED'])->assertOk();
        $this->assertFalse($story->fresh()->isPublic());
        $this->postJson($url, ['status' => 'PUBLISHED'])->assertStatus(409);

        $this->assertSame(2, AuditLog::where('action', 'story.status_changed')->count());
        // Status is not writable through the plain update.
        $this->patchJson("/api/v1/admin/stories/{$story->id}", ['status' => 'PUBLISHED'])->assertOk();
        $this->assertSame(PublicationStatus::Archived, $story->fresh()->status);
    }

    public function test_place_create_and_publish(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $category = Category::factory()->create(['type' => 'place']);

        $id = $this->postJson('/api/v1/admin/places', [
            'name' => 'Test Waterfall', 'is_free' => true, 'category_ids' => [$category->id],
            'facilities' => [['name' => 'Parking'], ['name' => 'Toilets', 'notes' => 'Seasonal']],
        ])->assertCreated()->assertJsonPath('data.status', 'DRAFT')->assertJsonCount(2, 'data.facilities')->json('data.id');

        $place = Place::findOrFail($id);
        $this->postJson("/api/v1/admin/places/{$id}/status", ['status' => 'PUBLISHED'])->assertOk();
        $this->assertNotNull($place->fresh()->published_at);
        $this->getJson("/api/v1/places/{$place->slug}")->assertOk();
    }

    public function test_collection_items_and_publication(): void
    {
        $curator = $this->actingAsRole(RoleName::Editor);
        $business = Business::factory()->create();
        $place = Place::factory()->create();

        $id = $this->postJson('/api/v1/admin/collections', ['title' => 'Test Picks'])->assertCreated()->json('data.id');
        $this->assertSame($curator->id, Collection::find($id)->curator_id);

        $this->postJson("/api/v1/admin/collections/{$id}/status", ['status' => 'PUBLISHED'])->assertStatus(409);

        $this->putJson("/api/v1/admin/collections/{$id}/items", ['items' => [
            ['type' => 'place', 'id' => $place->id, 'note' => 'Go early'],
            ['type' => 'business', 'id' => $business->id],
        ]])->assertOk()->assertJsonCount(2, 'data.items')->assertJsonPath('data.items.0.item_id', $place->id);

        $log = $this->lastAudit('collection.items_updated');
        $this->assertSame([], $log->old_values['items']);
        $this->assertCount(2, $log->new_values['items']);

        $this->putJson("/api/v1/admin/collections/{$id}/items", ['items' => [
            ['type' => 'user', 'id' => $curator->id],
            ['type' => 'place', 'id' => '01ARZ3NDEKTSV4RRFFQ69G5FAV'],
        ]])->assertUnprocessable()->assertJsonValidationErrors('items.0.type');
        $this->putJson("/api/v1/admin/collections/{$id}/items", ['items' => [
            ['type' => 'place', 'id' => '01ARZ3NDEKTSV4RRFFQ69G5FAV'],
            ['type' => 'business', 'id' => $business->id],
            ['type' => 'business', 'id' => $business->id],
        ]])->assertUnprocessable()->assertJsonValidationErrors(['items.0.id', 'items.2.id']);

        $this->postJson("/api/v1/admin/collections/{$id}/status", ['status' => 'PUBLISHED'])->assertOk();
    }

    public function test_category_hierarchy_rules(): void
    {
        $this->actingAsRole(RoleName::Editor);
        $parent = Category::factory()->create(['type' => 'business', 'parent_id' => null]);
        $child = Category::factory()->create(['type' => 'business', 'parent_id' => $parent->id]);
        $placeParent = Category::factory()->create(['type' => 'place', 'parent_id' => null]);

        $this->postJson('/api/v1/admin/categories', ['name' => 'Mixed', 'type' => 'business', 'parent_id' => $placeParent->id])
            ->assertUnprocessable()->assertJsonValidationErrors('parent_id');
        $this->postJson('/api/v1/admin/categories', ['name' => 'Grandchild', 'type' => 'business', 'parent_id' => $child->id])
            ->assertUnprocessable()->assertJsonValidationErrors('parent_id');
        $this->patchJson("/api/v1/admin/categories/{$parent->id}", ['parent_id' => $placeParent->id])
            ->assertUnprocessable();
        $this->patchJson("/api/v1/admin/categories/{$child->id}", ['type' => 'place'])
            ->assertUnprocessable()->assertJsonValidationErrors('type');

        $this->deleteJson("/api/v1/admin/categories/{$parent->id}")->assertUnprocessable();
        $this->deleteJson("/api/v1/admin/categories/{$child->id}")->assertNoContent();
        $this->deleteJson("/api/v1/admin/categories/{$parent->id}")->assertNoContent();
        $this->assertSame(2, AuditLog::where('action', 'category.deleted')->count());
    }

    public function test_area_crud_is_audited(): void
    {
        $this->actingAsRole(RoleName::Editor);

        $id = $this->postJson('/api/v1/admin/areas', ['name' => 'Test Valley', 'latitude' => 30.3, 'longitude' => 78.0])
            ->assertCreated()->json('data.id');
        $this->patchJson("/api/v1/admin/areas/{$id}", ['is_published' => false])->assertOk()->assertJsonPath('data.is_published', false);
        $this->patchJson("/api/v1/admin/areas/{$id}", ['latitude' => 30.3])->assertUnprocessable()->assertJsonValidationErrors('longitude');

        $this->assertSame(['is_published' => true], $this->lastAudit('area.updated')->old_values);
    }
}
