<?php

namespace App\Services\Seo;

/**
 * Resolved head metadata for one site URL.
 */
final class SeoPage
{
    /**
     * @param  list<array<string, mixed>>  $jsonLd  schema.org nodes (combined into one @graph)
     */
    public function __construct(
        public string $title,
        public string $description,
        public string $canonical,
        public string $robots = 'index,follow',
        public string $type = 'website',
        public ?string $image = null,
        public array $jsonLd = [],
        public int $status = 200,
        public ?string $redirect = null,
        public string $siteName = 'DoonPortal',
        public ?string $twitterHandle = null,
    ) {}

    public function isIndexable(): bool
    {
        return str_starts_with($this->robots, 'index');
    }

    public function jsonLdScript(): ?string
    {
        if ($this->jsonLd === []) {
            return null;
        }

        // JSON_HEX_TAG keeps "</script>" in data from closing the tag.
        return json_encode(['@context' => 'https://schema.org', '@graph' => $this->jsonLd],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'title' => $this->title,
            'description' => $this->description,
            'canonical' => $this->canonical,
            'robots' => $this->robots,
            'type' => $this->type,
            'image' => $this->image,
            'site_name' => $this->siteName,
            'twitter_handle' => $this->twitterHandle,
            'json_ld' => $this->jsonLd === [] ? null : ['@context' => 'https://schema.org', '@graph' => $this->jsonLd],
        ];
    }
}
