<?php

namespace App\Http\Requests\Admin;

use App\Enums\CategoryType;
use App\Models\Category;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The taxonomy is two levels deep: a parent must be a top-level category of
 * the same type, and a category with children cannot itself get a parent.
 * The type is fixed once created.
 */
class CategoryRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['parent_id', 'type', 'name', 'slug', 'description', 'icon', 'is_active', 'sort_order'];
    }

    public function rules(): array
    {
        return [
            'type' => $this->creating()
                ? ['required', Rule::in(CategoryType::values())]
                : ['prohibited'],
            'parent_id' => ['sometimes', 'nullable', 'string', Rule::exists('categories', 'id')->whereNull('parent_id')->whereNull('deleted_at')],
            'name' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('categories', 'category'),
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $parentId = $this->input('parent_id');
            if ($validator->errors()->isNotEmpty() || blank($parentId)) {
                return;
            }
            /** @var Category|null $category */
            $category = $this->routeModel('category');
            $parent = Category::find($parentId);
            $type = $category?->type->value ?? $this->input('type');

            if ($category && $parent?->is($category)) {
                $validator->errors()->add('parent_id', 'A category cannot be its own parent.');
            } elseif ($parent && $parent->type->value !== $type) {
                $validator->errors()->add('parent_id', 'The parent category must be of the same type.');
            } elseif ($category && $category->children()->exists()) {
                $validator->errors()->add('parent_id', 'A category with sub-categories cannot be nested under another category.');
            }
        }];
    }
}
