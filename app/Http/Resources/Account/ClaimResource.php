<?php

namespace App\Http\Resources\Account;

use App\Models\BusinessClaim;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An ownership claim as its claimant (or staff) sees it.
 *
 * @mixin BusinessClaim
 */
class ClaimResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'claimant_role' => $this->claimant_role,
            'contact_phone' => $this->contact_phone,
            'contact_email' => $this->contact_email,
            'message' => $this->evidence['message'] ?? null,
            'evidence_links' => $this->evidence['links'] ?? [],
            'review_notes' => $this->review_notes,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'business' => $this->whenLoaded('business', fn () => $this->business ? [
                'id' => $this->business->id,
                'name' => $this->business->name,
                'slug' => $this->business->slug,
                'owner_id' => $request->user()?->can('claims.manage') ? $this->business->owner_id : null,
            ] : null),
            'user' => $this->when($request->user()?->can('claims.manage'), fn () => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ] : null)),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer ? ['name' => $this->reviewer->name] : null),
        ];
    }
}
