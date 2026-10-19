<?php

namespace App\Http\Requests\Admin;

use App\Enums\CategoryType;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class BusinessRequest extends AdminWriteRequest
{
    public const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'x', 'youtube', 'linkedin', 'whatsapp', 'zomato', 'swiggy', 'google_maps', 'other'];

    public function attributeKeys(): array
    {
        return [
            'name', 'slug', 'tagline', 'description', 'is_published', 'is_featured',
            'address_line', 'locality', 'city', 'pincode', 'primary_area_id', 'latitude', 'longitude',
            'phone', 'whatsapp', 'email', 'website', 'price_range', 'amenities', 'payment_methods',
            'logo_media_id', 'cover_media_id', 'opened_on', 'last_verified_at', 'source_name', 'source_url',
        ];
    }

    public function rules(): array
    {
        return [
            'name' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('businesses', 'business'),
            'tagline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'is_published' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'locality' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:100'],
            'pincode' => ['sometimes', 'nullable', 'regex:/^[1-9][0-9]{5}$/'],
            'primary_area_id' => ['sometimes', 'nullable', 'string', $this->existingArea()],
            ...$this->coordinateRules(),
            'phone' => ['sometimes', 'nullable', 'string', self::PHONE_REGEX],
            'whatsapp' => ['sometimes', 'nullable', 'string', self::PHONE_REGEX],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'website' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'price_range' => ['sometimes', 'nullable', 'integer', 'between:1,4'],
            'amenities' => ['sometimes', 'nullable', 'array', 'max:30'],
            'amenities.*' => ['string', 'max:60', 'distinct'],
            'payment_methods' => ['sometimes', 'nullable', 'array', 'max:15'],
            'payment_methods.*' => ['string', 'max:40', 'distinct'],
            'logo_media_id' => ['sometimes', 'nullable', 'string', $this->mediaRule()],
            'cover_media_id' => ['sometimes', 'nullable', 'string', $this->mediaRule()],
            'opened_on' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'last_verified_at' => ['sometimes', 'nullable', 'date', 'before_or_equal:now'],
            ...$this->sourceRules(),

            'category_ids' => ['sometimes', 'array', 'max:10'],
            'category_ids.*' => ['string', 'distinct', $this->categoryOfType(CategoryType::Business)],
            'primary_category_id' => ['sometimes', 'nullable', 'string', 'required_with:category_ids', 'in_array:category_ids.*'],
            'area_ids' => ['sometimes', 'array', 'max:10'],
            'area_ids.*' => ['string', 'distinct', $this->existingArea()],

            'hours' => ['sometimes', 'array', 'max:21'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'hours.*.is_closed' => ['sometimes', 'boolean'],
            'hours.*.opens_at' => ['nullable', 'date_format:H:i', 'required_unless:hours.*.is_closed,true,1'],
            'hours.*.closes_at' => ['nullable', 'date_format:H:i', 'required_unless:hours.*.is_closed,true,1'],

            'services' => ['sometimes', 'array', 'max:50'],
            'services.*.name' => ['required', 'string', 'max:255'],
            'services.*.description' => ['nullable', 'string', 'max:2000'],
            'services.*.price_min_paise' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'services.*.price_max_paise' => ['nullable', 'integer', 'min:0', 'max:100000000'],

            'social_links' => ['sometimes', 'array', 'max:10'],
            'social_links.*.platform' => ['required', 'string', 'distinct', Rule::in(self::SOCIAL_PLATFORMS)],
            'social_links.*.url' => ['required', 'url:https,http', 'max:2048'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            foreach ((array) $this->input('services', []) as $i => $service) {
                $min = $service['price_min_paise'] ?? null;
                $max = $service['price_max_paise'] ?? null;
                if (is_numeric($min) && is_numeric($max) && $max < $min) {
                    $validator->errors()->add("services.{$i}.price_max_paise", 'The maximum price must be at least the minimum price.');
                }
            }
            foreach ((array) $this->input('hours', []) as $i => $slot) {
                if (! filter_var($slot['is_closed'] ?? false, FILTER_VALIDATE_BOOL) && ($slot['opens_at'] ?? null) !== null
                    && ($slot['opens_at'] ?? null) === ($slot['closes_at'] ?? null)) {
                    $validator->errors()->add("hours.{$i}.closes_at", 'Opening and closing times cannot be the same.');
                }
            }
        }];
    }
}
