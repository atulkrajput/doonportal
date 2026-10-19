<?php

namespace App\Http\Requests\Admin;

use App\Models\Page;
use App\Services\HtmlSanitizer;
use Illuminate\Validation\Rule;

class PageRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['slug', 'title', 'summary', 'body', 'show_in_footer', 'sort_order'];
    }

    public function rules(): array
    {
        return [
            'title' => [$this->requiredOnCreate(), 'string', 'max:120'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::notIn(Page::RESERVED_SLUGS), $this->uniqueSlug('pages', 'page')],
            'summary' => ['sometimes', 'nullable', 'string', 'max:320'],
            'body' => ['sometimes', 'nullable', 'string', 'max:'.HtmlSanitizer::MAX_INPUT_LENGTH],
            'show_in_footer' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:65535'],
        ];
    }

    public function messages(): array
    {
        return ['slug.not_in' => 'This address is used by another part of the site. Choose a different slug.'];
    }

    public function modelAttributes(): array
    {
        $attributes = parent::modelAttributes();
        if (array_key_exists('body', $attributes)) {
            $attributes['body'] = app(HtmlSanitizer::class)->sanitize($attributes['body']);
        }

        return $attributes;
    }
}
