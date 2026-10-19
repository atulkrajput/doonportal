<?php

namespace App\Http\Requests\Admin;

use App\Enums\EntityType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Replaces a collection's items. Order in the payload becomes the position.
 */
class CollectionItemsRequest extends FormRequest
{
    public const MAX_ITEMS = 100;

    public function rules(): array
    {
        return [
            'items' => ['present', 'array', 'max:'.self::MAX_ITEMS],
            'items.*.type' => ['required', 'string', Rule::in(EntityType::values(EntityType::collectable()))],
            'items.*.id' => ['required', 'string', 'size:26'],
            'items.*.note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $seen = [];
            foreach ($this->input('items', []) as $i => $item) {
                $key = $item['type'].':'.$item['id'];
                if (isset($seen[$key])) {
                    $validator->errors()->add("items.{$i}.id", 'This item is already in the collection.');
                }
                $seen[$key] = true;

                $class = EntityType::from($item['type'])->modelClass();
                if (! $class::query()->whereKey($item['id'])->exists()) {
                    $validator->errors()->add("items.{$i}.id", "The selected {$item['type']} does not exist.");
                }
            }
        }];
    }
}
