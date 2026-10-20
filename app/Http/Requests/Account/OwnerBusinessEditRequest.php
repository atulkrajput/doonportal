<?php

namespace App\Http\Requests\Account;

use App\Http\Requests\Admin\BusinessRequest;
use App\Services\Community\OwnerEditService;
use Illuminate\Support\Arr;

/**
 * An owner's proposed changes to their listing. Same validation as the admin
 * form, limited to the fields owners may change: name, categories, areas,
 * visibility and verification stay with staff.
 */
class OwnerBusinessEditRequest extends BusinessRequest
{
    public function attributeKeys(): array
    {
        return array_values(array_intersect(parent::attributeKeys(), OwnerEditService::ATTRIBUTES));
    }

    public function rules(): array
    {
        $allowed = [...OwnerEditService::ATTRIBUTES, ...OwnerEditService::RELATIONS];

        return Arr::where(parent::rules(), function ($rules, string $key) use ($allowed) {
            return in_array(strtok($key, '.'), $allowed, true);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function proposal(): array
    {
        return Arr::only($this->validated(), [...OwnerEditService::ATTRIBUTES, ...OwnerEditService::RELATIONS]);
    }
}
