<?php

namespace App\Http\Requests\Admin;

class AreaRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['name', 'slug', 'summary', 'description', 'latitude', 'longitude', 'cover_media_id', 'is_published', 'sort_order'];
    }

    public function rules(): array
    {
        return [
            'name' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('areas', 'area'),
            'summary' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            ...$this->coordinateRules(),
            'cover_media_id' => ['sometimes', 'nullable', 'string', $this->mediaRule()],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
