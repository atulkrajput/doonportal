<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CategoryType;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CategoryController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['type' => ['nullable', Rule::in(CategoryType::values())]]);

        $query = Category::query()->with('parent:id,name,slug')->withCount('children')
            ->when($request->filterValue('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->validated('is_published') !== null, fn ($q) => $q->where('is_active', $request->boolean('is_published')));

        return AdminRecordResource::collection(
            $this->paginate($query, $request, ['name', 'slug'], ['name' => 'name'])
        );
    }

    public function show(Category $category): AdminRecordResource
    {
        return new AdminRecordResource($category->load(['parent:id,name,slug', 'children:id,parent_id,name,slug,is_active']));
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = $this->saveAudited(new Category, $request->modelAttributes());

        return (new AdminRecordResource($category->load('parent:id,name,slug')))->response()->setStatusCode(201);
    }

    public function update(CategoryRequest $request, Category $category): AdminRecordResource
    {
        $this->saveAudited($category, $request->modelAttributes());

        return new AdminRecordResource($category->load('parent:id,name,slug'));
    }

    public function destroy(Category $category): Response
    {
        if ($category->children()->exists()) {
            throw ValidationException::withMessages(['category' => 'Move or delete the sub-categories first.']);
        }

        $this->deleteAudited($category);

        return response()->noContent();
    }

    public function restore(Category $category): AdminRecordResource
    {
        $this->restoreAudited($category);

        return new AdminRecordResource($category->load('parent:id,name,slug'));
    }
}
