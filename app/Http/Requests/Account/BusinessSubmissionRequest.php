<?php

namespace App\Http\Requests\Account;

use App\Enums\CategoryType;
use App\Http\Requests\Concerns\NormalizesPhone;
use App\Rules\PhoneNumberRule;
use App\Support\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A member's new listing. Kept short on purpose: once approved, the member
 * owns the listing and can add hours, services and more from their account.
 */
class BusinessSubmissionRequest extends FormRequest
{
    use NormalizesPhone;

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'string', Rule::exists('categories', 'id')->where('type', CategoryType::Business->value)->whereNull('deleted_at')],
            'area_id' => ['nullable', 'string', Rule::exists('areas', 'id')->whereNull('deleted_at')],
            'tagline' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'address_line' => ['required', 'string', 'max:255'],
            'locality' => ['nullable', 'string', 'max:255'],
            'pincode' => ['nullable', 'regex:/^[1-9][0-9]{5}$/'],
            ...$this->phoneRules('phone', 'phone_country', required: true),
            'whatsapp' => ['nullable', 'string', 'max:25', new PhoneNumberRule('phone_country')],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'url:http,https', 'max:2048'],
            'relationship' => ['required', 'string', Rule::in(BusinessClaimRequest::ROLES)],
            'confirm' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'confirm.accepted' => 'Please confirm you are authorised to list this business.',
            'pincode.regex' => 'Enter a 6-digit PIN code.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function listing(): array
    {
        $data = $this->withNormalizedPhone($this->safe()->except('confirm'), 'phone', 'phone_country');

        if (filled($data['whatsapp'] ?? null)) {
            $data['whatsapp'] = PhoneNumber::toE164($data['whatsapp'], $data['phone_country']);
        }

        return $data;
    }

    protected function prepareForValidation(): void
    {
        $this->uppercaseCountries(['phone_country']);
    }
}
