<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class VenueRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['name', 'slug', 'address_line', 'area_id', 'latitude', 'longitude', 'business_id', 'place_id', 'capacity'];
    }

    public function rules(): array
    {
        return [
            'name' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('venues', 'venue'),
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'area_id' => ['sometimes', 'nullable', 'string', $this->existingArea()],
            ...$this->coordinateRules(),
            'business_id' => ['sometimes', 'nullable', 'string', Rule::exists('businesses', 'id')->whereNull('deleted_at')],
            'place_id' => ['sometimes', 'nullable', 'string', Rule::exists('places', 'id')->whereNull('deleted_at')],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:1000000'],
        ];
    }
}
