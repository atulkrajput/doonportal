<?php

namespace App\Http\Requests;

use App\Enums\AnalyticsEventName;
use App\Enums\EntityType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnalyticsEventRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', Rule::enum(AnalyticsEventName::class)],
            'entity_type' => ['nullable', 'required_with:entity_id', Rule::in(EntityType::values([
                EntityType::Business, EntityType::Place, EntityType::Event, EntityType::Story, EntityType::Collection,
            ]))],
            'entity_id' => ['nullable', 'required_with:entity_type', 'ulid'],
            // Small, flat, non-personal context only (e.g. {"query": "cafe", "source": "home"}).
            'properties' => ['sometimes', 'array', 'max:10'],
            'properties.*' => ['nullable', function (string $attribute, mixed $value, \Closure $fail) {
                if (! is_scalar($value) || mb_strlen((string) $value) > 200) {
                    $fail('Each property must be a scalar value of at most 200 characters.');
                }
            }],
        ];
    }
}
