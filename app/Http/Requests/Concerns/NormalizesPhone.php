<?php

namespace App\Http\Requests\Concerns;

use App\Rules\PhoneNumberRule;
use App\Support\PhoneNumber;
use Illuminate\Validation\Rule;

/**
 * Phone number + country fields on form requests: validate the number for the
 * chosen country, then store it in E.164.
 */
trait NormalizesPhone
{
    /**
     * @return array<string, mixed>
     */
    protected function phoneRules(string $field, string $countryField, bool $required = false): array
    {
        return [
            $countryField => ['sometimes', 'nullable', 'string', Rule::in(PhoneNumber::countryCodes())],
            $field => [...($required ? ['required'] : ['sometimes', 'nullable']), 'string', 'max:25', new PhoneNumberRule($countryField)],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function withNormalizedPhone(array $data, string $field, string $countryField): array
    {
        if (! array_key_exists($field, $data)) {
            return $data;
        }

        if (blank($data[$field])) {
            $data[$field] = null;
            $data[$countryField] = null;

            return $data;
        }

        $country = ($data[$countryField] ?? null) ?: PhoneNumber::DEFAULT_COUNTRY;
        $data[$field] = PhoneNumber::toE164($data[$field], $country);
        $data[$countryField] = $country;

        return $data;
    }

    /**
     * @param  list<string>  $fields
     */
    protected function uppercaseCountries(array $fields): void
    {
        $values = [];
        foreach ($fields as $field) {
            if (is_string($this->input($field))) {
                $values[$field] = strtoupper(trim($this->input($field)));
            }
        }
        $this->merge($values);
    }
}
