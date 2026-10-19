<?php

namespace App\Http\Requests\Admin;

use App\Enums\CategoryType;
use Illuminate\Validation\Validator;

class PlaceRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return [
            'name', 'slug', 'summary', 'description', 'is_featured',
            'address_line', 'primary_area_id', 'latitude', 'longitude',
            'timings', 'is_free', 'entry_fee_min_paise', 'entry_fee_max_paise', 'entry_fee_notes',
            'accessibility_notes', 'has_parking', 'best_time_to_visit', 'cover_media_id',
            'last_verified_at', 'source_name', 'source_url',
        ];
    }

    public function rules(): array
    {
        return [
            'name' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('places', 'place'),
            'summary' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'is_featured' => ['sometimes', 'boolean'],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'primary_area_id' => ['sometimes', 'nullable', 'string', $this->existingArea()],
            ...$this->coordinateRules(),
            'timings' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_free' => ['sometimes', 'nullable', 'boolean'],
            'entry_fee_min_paise' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000000'],
            'entry_fee_max_paise' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000000'],
            'entry_fee_notes' => ['sometimes', 'nullable', 'string', 'max:255'],
            'accessibility_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'has_parking' => ['sometimes', 'nullable', 'boolean'],
            'best_time_to_visit' => ['sometimes', 'nullable', 'string', 'max:255'],
            'cover_media_id' => ['sometimes', 'nullable', 'string', $this->mediaRule()],
            'last_verified_at' => ['sometimes', 'nullable', 'date', 'before_or_equal:now'],
            ...$this->sourceRules(),

            'category_ids' => ['sometimes', 'array', 'max:10'],
            'category_ids.*' => ['string', 'distinct', $this->categoryOfType(CategoryType::Place)],
            'area_ids' => ['sometimes', 'array', 'max:10'],
            'area_ids.*' => ['string', 'distinct', $this->existingArea()],
            'facilities' => ['sometimes', 'array', 'max:30'],
            'facilities.*.name' => ['required', 'string', 'max:100', 'distinct'],
            'facilities.*.notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $min = $this->input('entry_fee_min_paise');
            $max = $this->input('entry_fee_max_paise');
            if (is_numeric($min) && is_numeric($max) && $max < $min) {
                $validator->errors()->add('entry_fee_max_paise', 'The maximum fee must be at least the minimum fee.');
            }
        }];
    }
}
