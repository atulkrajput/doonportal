<?php

namespace App\Http\Requests\Discovery;

class PlaceIndexRequest extends ListRequest
{
    public static function sorts(): array
    {
        return ['popular', 'rating', 'newest', 'name'];
    }

    protected function filterRules(): array
    {
        return [
            'category' => ['sometimes', 'string', 'max:100'],
            'area' => ['sometimes', 'string', 'max:100'],
            'free' => ['sometimes', 'boolean'],
        ];
    }
}
