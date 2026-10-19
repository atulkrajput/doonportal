<?php

namespace App\Http\Resources;

use App\Enums\EventStatus;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Times are returned as ISO-8601 in the event's own time zone.
 *
 * @mixin Event
 */
class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $local = fn ($dt) => $dt?->copy()->setTimezone($this->timezone)->toIso8601String();

        return [
            'type' => 'event',
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'status' => $this->status->value,
            'phase' => $this->phase(),
            'is_cancelled' => $this->status === EventStatus::Cancelled,
            'cancellation_reason' => $this->cancellation_reason,
            'is_rescheduled' => $this->isRescheduled(),
            'original_starts_at' => $local($this->original_starts_at),
            'starts_at' => $local($this->starts_at),
            'ends_at' => $local($this->ends_at),
            'timezone' => $this->timezone,
            'is_all_day' => $this->is_all_day,
            'is_featured' => $this->is_featured,
            'is_demo' => $this->isDemo(),
            'venue' => $this->whenLoaded('venue', fn () => $this->venue ? [
                'name' => $this->venue->name,
                'slug' => $this->venue->slug,
                'address' => $this->venue->address_line,
                'location' => $this->venue->latitude !== null
                    ? ['lat' => $this->venue->latitude, 'lng' => $this->venue->longitude] : null,
            ] : null),
            'area' => new AreaResource($this->whenLoaded('area')),
            'organizer' => $this->whenLoaded('organizer', fn () => $this->organizer ? [
                'name' => $this->organizer->name,
                'slug' => $this->organizer->slug,
                'website' => $this->organizer->website,
            ] : null),
            'online_url' => $this->online_url,
            'price' => [
                'is_free' => $this->is_free,
                'min_paise' => $this->price_min_paise,
                'max_paise' => $this->price_max_paise,
                'currency' => $this->currency,
            ],
            'ticket_url' => $this->ticket_url,
            'age_restriction' => $this->age_restriction,
            'contact' => ['phone' => $this->contact_phone, 'email' => $this->contact_email],
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'cover' => new MediaResource($this->whenLoaded('cover')),
            'provenance' => ['source_name' => $this->source_name, 'source_url' => $this->source_url],
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
