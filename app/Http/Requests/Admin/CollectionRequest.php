<?php

namespace App\Http\Requests\Admin;

class CollectionRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['title', 'slug', 'description', 'selection_criteria', 'is_featured', 'cover_media_id'];
    }

    public function rules(): array
    {
        return [
            'title' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('collections', 'collection'),
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'selection_criteria' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'is_featured' => ['sometimes', 'boolean'],
            'cover_media_id' => ['sometimes', 'nullable', 'string', $this->mediaRule()],
        ];
    }
}
