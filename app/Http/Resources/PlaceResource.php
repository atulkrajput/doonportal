<?php

namespace App\Http\Resources;

use App\Models\Place;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Place
 */
class PlaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'type' => 'place',
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'is_featured' => $this->is_featured,
            'is_demo' => $this->isDemo(),
            'address' => $this->address_line,
            'area' => new AreaResource($this->whenLoaded('primaryArea')),
            'location' => $this->latitude !== null ? ['lat' => $this->latitude, 'lng' => $this->longitude] : null,
            'timings' => $this->timings,
            'entry' => [
                'is_free' => $this->is_free,
                'fee_min_paise' => $this->entry_fee_min_paise,
                'fee_max_paise' => $this->entry_fee_max_paise,
                'notes' => $this->entry_fee_notes,
            ],
            'accessibility_notes' => $this->accessibility_notes,
            'has_parking' => $this->has_parking,
            'best_time_to_visit' => $this->best_time_to_visit,
            'rating' => ['average' => round($this->rating_avg, 1), 'count' => $this->rating_count],
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'areas' => AreaResource::collection($this->whenLoaded('areas')),
            'facilities' => $this->whenLoaded('facilities', fn () => $this->facilities->map(fn ($f) => [
                'name' => $f->name,
                'notes' => $f->notes,
            ])),
            'cover' => new MediaResource($this->whenLoaded('cover')),
            'provenance' => [
                'source_name' => $this->source_name,
                'source_url' => $this->source_url,
                'last_verified_at' => $this->last_verified_at?->toIso8601String(),
            ],
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
