<?php

namespace App\Http\Resources\Account;

use App\Models\Business;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A review with its moderation status: for its author, the reviewed listing's
 * owner, or moderators.
 *
 * @mixin Review
 */
class MyReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $listing = $this->relationLoaded('reviewable') ? $this->reviewable : null;

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'visited_on' => $this->visited_on?->toDateString(),
            'owner_reply' => $this->owner_reply,
            'owner_replied_at' => $this->owner_replied_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'listing' => $listing ? [
                'type' => $listing->getMorphClass(),
                'id' => $listing->getKey(),
                'name' => $listing instanceof Business ? $listing->name : ($listing->name ?? $listing->title ?? null),
                'slug' => $listing->slug ?? null,
            ] : null,
            'author' => $this->whenLoaded('user', fn () => ['name' => $this->user?->name]),
        ];
    }
}
