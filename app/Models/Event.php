<?php

namespace App\Models;

use App\Enums\EventStatus;
use App\Models\Concerns\HasUniqueSlug;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Event extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    /** How long an event without an end time is assumed to run. */
    public const DEFAULT_DURATION_HOURS = 6;

    /** All-day events start at local midnight; without an end they run for the whole day. */
    public const ALL_DAY_DURATION_HOURS = 24;

    /**
     * status and published_at change only through StatusTransitionService.
     */
    protected $fillable = [
        'title', 'slug', 'summary', 'description', 'is_featured',
        'starts_at', 'ends_at', 'timezone', 'is_all_day', 'original_starts_at', 'cancellation_reason',
        'venue_id', 'area_id', 'organizer_id', 'online_url',
        'is_free', 'price_min_paise', 'price_max_paise', 'currency', 'ticket_url', 'age_restriction',
        'contact_phone', 'contact_email', 'cover_media_id', 'submitted_by', 'source_name', 'source_url', 'metadata',
    ];

    protected $attributes = [
        'status' => 'DRAFT',
        'timezone' => 'Asia/Kolkata',
    ];

    public function slugSource(): string
    {
        return 'title';
    }

    protected function casts(): array
    {
        return [
            'status' => EventStatus::class,
            'is_featured' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'original_starts_at' => 'datetime',
            'is_all_day' => 'boolean',
            'is_free' => 'boolean',
            'price_min_paise' => 'integer',
            'price_max_paise' => 'integer',
            'published_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function scopePublic(Builder $query): void
    {
        $query->whereIn('status', EventStatus::publicValues())->whereNotNull('starts_at');
    }

    /**
     * Not yet finished: ends in the future, or (without an end) started within its
     * assumed duration — the whole day for all-day events, 6 hours otherwise.
     */
    public function scopeUpcomingOrLive(Builder $query, ?CarbonInterface $now = null): void
    {
        $now = Carbon::instance($now ?? now());
        $query->where(fn ($q) => $q
            ->where('ends_at', '>=', $now)
            ->orWhere(fn ($q) => $q->whereNull('ends_at')->where('is_all_day', false)
                ->where('starts_at', '>=', $now->copy()->subHours(self::DEFAULT_DURATION_HOURS)))
            ->orWhere(fn ($q) => $q->whereNull('ends_at')->where('is_all_day', true)
                ->where('starts_at', '>=', $now->copy()->subHours(self::ALL_DAY_DURATION_HOURS))));
    }

    public function isPublic(): bool
    {
        return in_array($this->status->value, EventStatus::publicValues(), true) && $this->starts_at !== null;
    }

    public function isDemo(): bool
    {
        return (bool) ($this->metadata['demo'] ?? false);
    }

    /**
     * Derived lifecycle phase for display: DRAFT..REVIEW, UPCOMING, LIVE, COMPLETED, CANCELLED, ARCHIVED.
     */
    public function phase(?Carbon $now = null): string
    {
        if ($this->status !== EventStatus::Published) {
            return $this->status->value;
        }

        $now ??= now();
        $end = $this->ends_at ?? $this->starts_at?->copy()->addHours(
            $this->is_all_day ? self::ALL_DAY_DURATION_HOURS : self::DEFAULT_DURATION_HOURS
        );

        return match (true) {
            $this->starts_at === null => 'UPCOMING',
            $now->lt($this->starts_at) => 'UPCOMING',
            $end !== null && $now->lte($end) => 'LIVE',
            default => 'COMPLETED',
        };
    }

    public function isRescheduled(): bool
    {
        return $this->original_starts_at !== null;
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(Organizer::class);
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'event_categories');
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function favorites(): MorphMany
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }
}
