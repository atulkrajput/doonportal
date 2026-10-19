<?php

namespace App\Models;

use App\Enums\PublicationStatus;
use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * An editable site page served at /{slug} (privacy, terms, about, contact…).
 */
class Page extends Model
{
    use HasUlids, HasUniqueSlug, SoftDeletes;

    /** Slugs that are site routes or reserved for other sections; pages cannot use them. */
    public const RESERVED_SLUGS = [
        'admin', 'api', 'login', 'register', 'forgot-password', 'reset-password', 'saved', 'search',
        'explore', 'services', 'businesses', 'business', 'places', 'place', 'events', 'event', 'areas', 'area',
        'stories', 'story', 'guide', 'collections', 'collection', 'business-portal', 'storage', 'up',
        'sitemap', 'robots', 'build', 'favicon',
    ];

    protected $fillable = ['slug', 'title', 'summary', 'body', 'show_in_footer', 'sort_order'];

    protected $attributes = [
        'status' => 'DRAFT',
    ];

    public function slugSource(): string
    {
        return 'title';
    }

    protected function casts(): array
    {
        return [
            'status' => PublicationStatus::class,
            'show_in_footer' => 'boolean',
            'sort_order' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function scopePublic(Builder $query): void
    {
        $query->where('status', PublicationStatus::Published->value);
    }

    public function isPublic(): bool
    {
        return $this->status === PublicationStatus::Published;
    }
}
