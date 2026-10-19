<?php

namespace App\Http\Requests\Admin;

use App\Enums\PlanInterval;
use Illuminate\Validation\Rule;

class PlanRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['name', 'slug', 'description', 'price_paise', 'interval', 'features', 'is_active', 'sort_order'];
    }

    public function rules(): array
    {
        return [
            'name' => [$this->requiredOnCreate(), 'string', 'max:100'],
            ...$this->slugRules('plans', 'plan'),
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'price_paise' => [$this->requiredOnCreate(), 'integer', 'min:0', 'max:100000000'],
            'interval' => [$this->requiredOnCreate(), Rule::in(PlanInterval::values())],
            'features' => ['sometimes', 'nullable', 'array', 'max:20'],
            'features.*' => ['string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
