<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff view of an account (no password, tokens or remember token).
 *
 * @mixin User
 */
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'email_verified' => $this->email_verified_at !== null,
            'roles' => $this->roles->pluck('name')->values(),
            'permissions' => $this->permissionNames(),
            'is_self' => $request->user()?->is($this->resource) ?? false,
            'is_trashed' => $this->trashed(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
