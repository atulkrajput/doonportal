<?php

namespace App\Http\Requests\Discovery;

use App\Enums\StoryType;
use Illuminate\Validation\Rule;

class StoryIndexRequest extends ListRequest
{
    public static function sorts(): array
    {
        return ['newest', 'oldest'];
    }

    protected function filterRules(): array
    {
        return [
            'category' => ['sometimes', 'string', 'max:100'],
            'type' => ['sometimes', Rule::in(StoryType::values())],
        ];
    }
}
