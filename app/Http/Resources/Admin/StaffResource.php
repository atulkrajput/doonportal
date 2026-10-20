<?php

namespace App\Http\Resources\Admin;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A staff account (no password or remember token).
 *
 * @mixin Admin
 */
class StaffResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => 'staff',
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'roles' => $this->roles->pluck('name')->values(),
            'permissions' => $this->permissionNames(),
            'is_active' => $this->is_active,
            'is_self' => $request->user()?->is($this->resource) ?? false,
            'is_trashed' => $this->trashed(),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
