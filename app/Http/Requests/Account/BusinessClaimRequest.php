<?php

namespace App\Http\Requests\Account;

use App\Http\Requests\Concerns\NormalizesPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessClaimRequest extends FormRequest
{
    use NormalizesPhone;

    public const ROLES = ['owner', 'manager', 'employee', 'agency'];

    public function rules(): array
    {
        return [
            'claimant_role' => ['required', 'string', Rule::in(self::ROLES)],
            ...$this->phoneRules('contact_phone', 'contact_phone_country', required: true),
            'contact_email' => ['required', 'string', 'email', 'max:255'],
            'message' => ['nullable', 'string', 'max:2000'],
            'evidence_links' => ['nullable', 'array', 'max:5'],
            'evidence_links.*' => ['nullable', 'url:https,http', 'max:2048'],
            'confirm' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'confirm.accepted' => 'Please confirm you are authorised to manage this business.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function details(): array
    {
        return $this->withNormalizedPhone($this->safe()->except('confirm'), 'contact_phone', 'contact_phone_country');
    }

    protected function prepareForValidation(): void
    {
        $this->uppercaseCountries(['contact_phone_country']);
    }
}
