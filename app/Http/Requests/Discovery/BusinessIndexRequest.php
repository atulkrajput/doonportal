<?php

namespace App\Http\Requests\Discovery;

class BusinessIndexRequest extends ListRequest
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
            'price' => ['sometimes', 'array', 'max:4'],
            'price.*' => ['integer', 'between:1,4'],
            'min_rating' => ['sometimes', 'numeric', 'between:0,5'],
            'open_now' => ['sometimes', 'boolean'],
            'verified' => ['sometimes', 'boolean'],
            'new' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Accept ?price=1,2 as well as ?price[]=1&price[]=2
        if (is_string($this->input('price'))) {
            $this->merge(['price' => array_filter(explode(',', $this->input('price')), 'strlen')]);
        }
    }
}
