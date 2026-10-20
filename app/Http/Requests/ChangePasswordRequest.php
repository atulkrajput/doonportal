<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function rules(): array
    {
        // Accounts created with Google have no password yet and set one without it.
        if (! $this->user()?->hasPassword()) {
            return [
                'password' => ['required', 'string', 'confirmed', Password::defaults()],
            ];
        }

        return [
            // Checked against the sanctum guard's user; a wrong value is a 422 on this field.
            'current_password' => ['required', 'string', 'current_password:sanctum'],
            'password' => ['required', 'string', 'confirmed', 'different:current_password', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.current_password' => 'Your current password is incorrect.',
            'password.different' => 'Choose a password you are not already using.',
        ];
    }
}
