<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CategoryType;
use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Category tree (top level with children), optionally for one entity type.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate(['type' => ['sometimes', Rule::in(CategoryType::values())]]);

        $categories = Category::query()->active()->whereNull('parent_id')
            ->when($validated['type'] ?? null, fn ($q, $type) => $q->where('type', $type))
            ->with(['children' => fn ($q) => $q->active()])
            ->orderBy('type')->orderBy('sort_order')->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function show(Category $category): CategoryResource
    {
        $this->ensureVisible($category);

        return new CategoryResource($category->load(['parent', 'children' => fn ($q) => $q->active()]));
    }
}
