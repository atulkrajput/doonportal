<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class OrganizerRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['name', 'slug', 'description', 'email', 'phone', 'website', 'user_id'];
    }

    public function rules(): array
    {
        return [
            'name' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('organizers', 'organizer'),
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', self::PHONE_REGEX],
            'website' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'user_id' => ['sometimes', 'nullable', 'string', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'business_ids' => ['sometimes', 'array', 'max:20'],
            'business_ids.*' => ['string', 'distinct', Rule::exists('businesses', 'id')->whereNull('deleted_at')],
        ];
    }
}
