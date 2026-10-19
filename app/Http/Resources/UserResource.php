<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Private view of the authenticated user. Never use for other users' profiles.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_path ? asset('storage/'.$this->avatar_path) : null,
            'email_verified' => $this->email_verified_at !== null,
            'roles' => $this->roles->pluck('name')->values(),
            'permissions' => $this->permissionNames(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
