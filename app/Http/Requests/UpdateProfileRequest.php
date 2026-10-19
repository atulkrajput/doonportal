<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:/^\+?[0-9 ()-]{7,20}$/'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
