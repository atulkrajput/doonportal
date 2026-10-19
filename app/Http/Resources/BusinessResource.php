<?php

namespace App\Http\Resources;

use App\Models\Business;
use App\Services\OpeningHours;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public business representation. Card fields are always present; detail-only
 * relations appear when the controller loads them.
 *
 * @mixin Business
 */
class BusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $hoursLoaded = $this->relationLoaded('hours') && $this->relationLoaded('hourExceptions');

        return [
            'type' => 'business',
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'status' => $this->status->value,
            'is_verified' => $this->status->isVerified(),
            'verified_at' => $this->verified_at?->toIso8601String(),
            'is_claimed' => $this->owner_id !== null,
            'is_featured' => $this->is_featured,
            'is_demo' => $this->isDemo(),
            'address' => [
                'line' => $this->address_line,
                'locality' => $this->locality,
                'city' => $this->city,
                'pincode' => $this->pincode,
            ],
            'area' => new AreaResource($this->whenLoaded('primaryArea')),
            'location' => $this->latitude !== null ? ['lat' => $this->latitude, 'lng' => $this->longitude] : null,
            'contact' => [
                'phone' => $this->phone,
                'whatsapp' => $this->whatsapp,
                'email' => $this->email,
                'website' => $this->website,
            ],
            'price_range' => $this->price_range,
            'rating' => ['average' => round($this->rating_avg, 1), 'count' => $this->rating_count],
            'amenities' => $this->amenities ?? [],
            'payment_methods' => $this->payment_methods ?? [],
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'logo' => new MediaResource($this->whenLoaded('logo')),
            'cover' => new MediaResource($this->whenLoaded('cover')),
            'open_now' => $this->when($hoursLoaded, fn () => OpeningHours::isOpen($this->resource)),
            'hours' => BusinessHourResource::collection($this->whenLoaded('hours')),
            'social_links' => $this->whenLoaded('socialLinks', fn () => $this->socialLinks->map(fn ($l) => [
                'platform' => $l->platform,
                'url' => $l->url,
            ])),
            'areas' => AreaResource::collection($this->whenLoaded('areas')),
            'opened_on' => $this->opened_on?->toDateString(),
            'provenance' => [
                'source_name' => $this->source_name,
                'source_url' => $this->source_url,
                'last_verified_at' => $this->last_verified_at?->toIso8601String(),
            ],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
