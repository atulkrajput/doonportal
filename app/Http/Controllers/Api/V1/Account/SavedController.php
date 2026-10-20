<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Enums\EntityType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Models\Favorite;
use App\Services\Discovery\EntityCards;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * The signed-in member's saved businesses, places, events and stories.
 */
class SavedController extends Controller
{
    public function index(SimpleListRequest $request): JsonResponse
    {
        $request->validate(['type' => ['nullable', Rule::in(EntityType::values(EntityType::favoritable()))]]);

        $page = $request->user()->favorites()
            ->when($request->query('type'), fn ($q, $type) => $q->where('favoritable_type', $type))
            ->latest()->orderByDesc('id')
            ->paginate($request->perPage());

        EntityCards::loadTargets($page->getCollection(), 'favoritable');

        return response()->json([
            'data' => $page->getCollection()->map(fn (Favorite $f) => [
                'type' => $f->favoritable_type,
                'id' => $f->favoritable_id,
                'saved_at' => $f->created_at?->toIso8601String(),
                // null when the listing has been unpublished or removed since it was saved
                'card' => EntityCards::card($f->favoritable),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    /**
     * "type:id" keys of everything saved, so pages can show filled hearts.
     */
    public function keys(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->favorites()->get(['favoritable_type', 'favoritable_id'])
                ->map(fn (Favorite $f) => "{$f->favoritable_type}:{$f->favoritable_id}")->values(),
        ]);
    }

    public function store(Request $request, string $type, string $id): JsonResponse
    {
        $this->findPublic($type, $id);

        $favorite = $request->user()->favorites()->firstOrCreate(['favoritable_type' => $type, 'favoritable_id' => $id]);

        return response()->json(['data' => ['type' => $type, 'id' => $id, 'saved' => true]], $favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, string $type, string $id): Response
    {
        abort_unless(in_array($type, EntityType::values(EntityType::favoritable()), true), 404);

        $request->user()->favorites()->where('favoritable_type', $type)->where('favoritable_id', $id)->delete();

        return response()->noContent();
    }

    private function findPublic(string $type, string $id): Model
    {
        abort_unless(in_array($type, EntityType::values(EntityType::favoritable()), true), 404);

        $model = EntityType::from($type)->modelClass()::query()->find($id);
        abort_if($model === null || (method_exists($model, 'isPublic') && ! $model->isPublic()), 404);

        return $model;
    }
}
