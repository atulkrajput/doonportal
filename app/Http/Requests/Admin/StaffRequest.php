<?php

namespace App\Http\Requests\Admin;

use App\Enums\RoleName;
use App\Models\Admin;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Create (POST: name, email, password, roles) or edit (PATCH: name, email, phone) a staff account.
 */
class StaffRequest extends FormRequest
{
    public function rules(): array
    {
        $creating = $this->isMethod('POST');
        $admin = $this->route('admin');

        return [
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:120'],
            'email' => [$creating ? 'required' : 'sometimes', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique('admins', 'email')->ignore($admin instanceof Admin ? $admin->id : null)],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:/^\+?[0-9][0-9 \-]{6,18}$/'],
            'password' => [$creating ? 'required' : 'prohibited', 'string', 'confirmed', Password::defaults()],
            'roles' => [$creating ? 'required' : 'prohibited', 'array', 'min:1', 'max:'.count(RoleName::staff())],
            'roles.*' => ['string', 'distinct', Rule::in(RoleName::staffValues())],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }
}
