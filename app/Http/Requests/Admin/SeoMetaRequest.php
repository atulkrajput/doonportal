<?php

namespace App\Http\Requests\Admin;

use App\Enums\EntityType;
use App\Models\SeoMeta;
use App\Services\Seo\SeoResolver;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * An SEO override targets either a site path (static or listing pages) or one
 * public record. Detail pages are overridden per record, not per path.
 */
class SeoMetaRequest extends FormRequest
{
    /** Record types that have public pages. */
    public const ENTITY_TYPES = ['business', 'place', 'event', 'story', 'collection', 'area'];

    public function rules(): array
    {
        $creating = $this->isMethod('POST');

        return [
            'path' => [$creating ? 'required_without:entity_type' : 'prohibited', 'nullable', 'string', 'max:255', 'regex:#^/([a-z0-9-]+(/[a-z0-9-]+)?)?$#',
                Rule::unique('seo_meta', 'path')],
            'entity_type' => [$creating ? 'required_without:path' : 'prohibited', 'nullable', 'prohibits:path', Rule::in(self::ENTITY_TYPES)],
            'entity_id' => [$creating ? 'required_with:entity_type' : 'prohibited', 'nullable', 'string', 'size:26'],
            'title' => ['nullable', 'string', 'max:70'],
            'description' => ['nullable', 'string', 'max:160'],
            'image_media_id' => ['nullable', 'string', 'exists:media,id'],
            'noindex' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty() || ! $this->isMethod('POST')) {
                return;
            }
            $path = $this->input('path');
            if ($path !== null) {
                $allowed = ['/', ...array_keys(SeoResolver::STATIC_PAGES)];
                $isCategory = preg_match('#^/(businesses|places)/[a-z0-9-]+$#', $path) === 1;
                if (! in_array($path, $allowed, true) && ! $isCategory) {
                    $validator->errors()->add('path', 'Use a site page such as /events or a category page such as /businesses/cafes. Override individual records from their edit screen.');
                }
            }
            if ($type = $this->input('entity_type')) {
                $class = EntityType::from($type)->modelClass();
                if (! $class::query()->whereKey($this->input('entity_id'))->exists()) {
                    $validator->errors()->add('entity_id', "The selected {$type} does not exist.");
                } elseif (SeoMeta::where('entity_type', $type)->where('entity_id', $this->input('entity_id'))->exists()) {
                    $validator->errors()->add('entity_id', 'This record already has SEO settings; edit them instead.');
                }
            }
        }];
    }
}
