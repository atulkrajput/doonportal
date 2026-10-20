<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class ReviewRequest extends FormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'rating' => [$required, 'integer', 'between:1,5'],
            'title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'body' => [$required, 'string', 'min:20', 'max:3000'],
            'visited_on' => ['sometimes', 'nullable', 'date', 'after:2000-01-01', 'before_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.min' => 'Tell others a little more: at least 20 characters.',
        ];
    }
}
