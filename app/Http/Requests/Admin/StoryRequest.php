<?php

namespace App\Http\Requests\Admin;

use App\Enums\CategoryType;
use App\Enums\EntityType;
use App\Enums\StoryType;
use App\Services\HtmlSanitizer;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The body is sanitized server-side by HtmlSanitizer in modelAttributes(); the
 * raw input is never stored.
 */
class StoryRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return [
            'type', 'title', 'slug', 'excerpt', 'body', 'is_featured', 'cover_media_id',
            'reading_minutes', 'seo_title', 'seo_description', 'published_at',
        ];
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes', Rule::in(StoryType::values())],
            'title' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('stories', 'story'),
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:500'],
            'body' => ['sometimes', 'nullable', 'string', 'max:'.HtmlSanitizer::MAX_INPUT_LENGTH],
            'is_featured' => ['sometimes', 'boolean'],
            'cover_media_id' => ['sometimes', 'nullable', 'string', $this->mediaRule()],
            'reading_minutes' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:240'],
            'seo_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'seo_description' => ['sometimes', 'nullable', 'string', 'max:320'],
            'published_at' => ['sometimes', 'nullable', 'date'],

            'category_ids' => ['sometimes', 'array', 'max:10'],
            'category_ids.*' => ['string', 'distinct', $this->categoryOfType(CategoryType::Story)],
            'linked_entities' => ['sometimes', 'array', 'max:30'],
            'linked_entities.*.type' => ['required', 'string', Rule::in(EntityType::values(EntityType::storyLinkable()))],
            'linked_entities.*.id' => ['required', 'string', 'size:26'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            foreach ((array) $this->input('linked_entities', []) as $i => $link) {
                $type = EntityType::tryFrom((string) ($link['type'] ?? ''));
                if ($type && is_string($link['id'] ?? null) && ! $type->modelClass()::query()->whereKey($link['id'])->exists()) {
                    $validator->errors()->add("linked_entities.{$i}.id", "The selected {$type->value} does not exist.");
                }
            }
        }];
    }

    public function modelAttributes(): array
    {
        $attributes = parent::modelAttributes();

        // Editors enter publish dates as Dehradun wall-clock time.
        if (array_key_exists('published_at', $attributes)) {
            $attributes['published_at'] = EventRequest::toUtc($attributes['published_at'], 'Asia/Kolkata');
        }

        if (array_key_exists('body', $attributes)) {
            $attributes['body'] = app(HtmlSanitizer::class)->sanitize($attributes['body']);
            if (! array_key_exists('reading_minutes', $attributes)) {
                $attributes['reading_minutes'] = HtmlSanitizer::readingMinutes($attributes['body']);
            }
        }

        return $attributes;
    }
}
