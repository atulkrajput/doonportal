<?php

namespace App\Http\Requests\Discovery;

class EventIndexRequest extends ListRequest
{
    public static function sorts(): array
    {
        return ['soonest', 'newest'];
    }

    protected function filterRules(): array
    {
        return [
            'category' => ['sometimes', 'string', 'max:100'],
            'area' => ['sometimes', 'string', 'max:100'],
            'when' => ['sometimes', 'string', 'in:today,tomorrow,weekend,week,month'],
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:from'],
            'free' => ['sometimes', 'boolean'],
            'include_past' => ['sometimes', 'boolean'],
        ];
    }
}
