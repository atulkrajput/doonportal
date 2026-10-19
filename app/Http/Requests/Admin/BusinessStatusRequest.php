<?php

namespace App\Http\Requests\Admin;

use App\Enums\BusinessStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(BusinessStatus::class)],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
