<?php

namespace App\Rules;

use App\Support\PhoneNumber;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Arr;

/**
 * A phone number valid for the country given in a sibling field.
 */
class PhoneNumberRule implements DataAwareRule, ValidationRule
{
    /** @var array<string, mixed> */
    private array $data = [];

    public function __construct(private readonly string $countryField) {}

    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $country = Arr::get($this->data, $this->countryField) ?: PhoneNumber::DEFAULT_COUNTRY;

        if (! is_string($value) || PhoneNumber::toE164($value, (string) $country) === null) {
            $name = PhoneNumber::countries()[strtoupper((string) $country)]['name'] ?? 'the selected country';
            $fail("Enter a valid mobile number for {$name}.");
        }
    }
}
