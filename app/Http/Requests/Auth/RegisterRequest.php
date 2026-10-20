<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\NormalizesPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    use NormalizesPhone;

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            ...$this->phoneRules('phone', 'phone_country'),
            'password' => ['required', 'confirmed', Password::defaults()],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function account(): array
    {
        $data = $this->safe()->only(['name', 'email', 'phone', 'phone_country', 'password']);

        return $this->withNormalizedPhone($data, 'phone', 'phone_country');
    }

    protected function prepareForValidation(): void
    {
        $this->uppercaseCountries(['phone_country']);
    }
}
