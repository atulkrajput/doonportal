<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff view of a member account (no password, tokens or Google id).
 *
 * @mixin User
 */
class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => 'member',
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'city' => $this->city,
            'email_verified' => $this->email_verified_at !== null,
            'google_linked' => $this->google_id !== null,
            'roles' => $this->roles->pluck('name')->values(),
            'owned_businesses' => $this->whenCounted('ownedBusinesses'),
            'reviews' => $this->whenCounted('reviews'),
            'is_trashed' => $this->trashed(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
