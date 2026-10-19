<?php

namespace App\Http\Resources;

use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Collection
 */
class CollectionResource extends JsonResource
{
    /** @var list<array<string, mixed>>|null */
    public ?array $entries = null;

    public function toArray(Request $request): array
    {
        return [
            'type' => 'collection',
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'selection_criteria' => $this->selection_criteria,
            'is_featured' => $this->is_featured,
            'is_demo' => $this->isDemo(),
            'cover' => new MediaResource($this->whenLoaded('cover')),
            'items_count' => $this->whenCounted('items'),
            'items' => $this->when($this->entries !== null, fn () => $this->entries),
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
