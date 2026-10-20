<?php

namespace App\Http\Resources;

use App\Enums\RoleName;
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
            'phone_country' => $this->phone_country,
            'bio' => $this->bio,
            'address' => [
                'line1' => $this->address_line1,
                'line2' => $this->address_line2,
                'city' => $this->city,
                'state' => $this->state,
                'postal_code' => $this->postal_code,
                'country' => $this->country,
            ],
            'avatar_url' => $this->avatar_path ? asset('storage/'.$this->avatar_path) : null,
            'email_verified' => $this->email_verified_at !== null,
            'has_password' => $this->hasPassword(),
            'google_linked' => $this->google_id !== null,
            'is_business_owner' => $this->hasRole(RoleName::BusinessOwner),
            'roles' => $this->roles->pluck('name')->values(),
            'permissions' => $this->permissionNames(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
