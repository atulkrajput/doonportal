<?php

namespace App\Http\Requests\Admin;

use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Shape validation only; who may grant or revoke which role is decided in
 * Admin\StaffController::updateRoles().
 */
class UserRolesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'roles' => ['present', 'array', 'max:'.count(RoleName::staff())],
            'roles.*' => ['string', 'distinct', Rule::in(RoleName::staffValues())],
        ];
    }
}
