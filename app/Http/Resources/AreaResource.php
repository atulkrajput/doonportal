<?php

namespace App\Http\Resources;

use App\Models\Area;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Area
 */
class AreaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'location' => $this->latitude !== null ? ['lat' => $this->latitude, 'lng' => $this->longitude] : null,
            'cover' => new MediaResource($this->whenLoaded('cover')),
            'counts' => $this->when(isset($this->businesses_count) || isset($this->places_count), fn () => [
                'businesses' => $this->businesses_count ?? null,
                'places' => $this->places_count ?? null,
                'events' => $this->events_count ?? null,
            ]),
        ];
    }
}
