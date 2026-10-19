<?php

namespace App\Http\Resources;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public review. Exposes only the reviewer's display name, never contact details.
 *
 * @mixin Review
 */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'visited_on' => $this->visited_on?->toDateString(),
            'helpful_count' => $this->helpful_count,
            'author' => $this->whenLoaded('user', fn () => ['name' => $this->user?->name]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
