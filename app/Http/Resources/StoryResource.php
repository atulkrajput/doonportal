<?php

namespace App\Http\Resources;

use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Story
 */
class StoryResource extends JsonResource
{
    /** Set by the controller for the detail view. */
    public bool $withBody = false;

    /** @var list<array<string, mixed>>|null */
    public ?array $linkedEntities = null;

    public function toArray(Request $request): array
    {
        return [
            'type' => 'story',
            'id' => $this->id,
            'story_type' => $this->type->value,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->when($this->withBody, fn () => $this->body),
            'is_featured' => $this->is_featured,
            'is_demo' => $this->isDemo(),
            'author' => $this->whenLoaded('author', fn () => $this->author ? ['name' => $this->author->name] : null),
            'cover' => new MediaResource($this->whenLoaded('cover')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'reading_minutes' => $this->reading_minutes,
            'seo' => ['title' => $this->seo_title ?? $this->title, 'description' => $this->seo_description ?? $this->excerpt],
            'linked_entities' => $this->when($this->linkedEntities !== null, fn () => $this->linkedEntities),
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
