<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizesPhone;
use App\Support\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProfileRequest extends FormRequest
{
    use NormalizesPhone;

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            ...$this->phoneRules('phone', 'phone_country'),
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'address_line1' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address_line2' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[A-Za-z0-9][A-Za-z0-9 \-]{1,18}$/'],
            'country' => ['sometimes', 'nullable', 'string', Rule::in(PhoneNumber::countryCodes())],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            $country = $this->input('country') ?? $this->user()?->country;
            if ($country === 'IN' && filled($this->input('postal_code')) && ! preg_match('/^[1-9][0-9]{5}$/', (string) $this->input('postal_code'))) {
                $validator->errors()->add('postal_code', 'Enter a 6-digit PIN code.');
            }
        }];
    }

    /**
     * Validated profile fields with the phone number in E.164.
     *
     * @return array<string, mixed>
     */
    public function profile(): array
    {
        return $this->withNormalizedPhone($this->validated(), 'phone', 'phone_country');
    }

    protected function prepareForValidation(): void
    {
        $this->uppercaseCountries(['phone_country', 'country']);
    }
}
