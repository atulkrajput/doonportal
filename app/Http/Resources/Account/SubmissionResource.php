<?php

namespace App\Http\Resources\Account;

use App\Models\Business;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A submission (new listing or an owner's edit) for its author or staff.
 *
 * @mixin Submission
 */
class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $entity = $this->relationLoaded('entity') ? $this->entity : null;

        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'status' => $this->status->value,
            'payload' => $this->payload,
            'review_notes' => $this->review_notes,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'business' => $entity instanceof Business ? ['id' => $entity->id, 'name' => $entity->name, 'slug' => $entity->slug] : null,
            'user' => $this->when($request->user()?->can('submissions.moderate'), fn () => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ] : null)),
            'reviewer' => $this->whenLoaded('reviewer', fn () => $this->reviewer ? ['name' => $this->reviewer->name] : null),
        ];
    }
}
