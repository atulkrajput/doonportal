<?php

namespace App\Services\Community;

use App\Enums\SubmissionStatus;
use App\Enums\SubmissionType;
use App\Models\Business;
use App\Models\BusinessHour;
use App\Models\BusinessService;
use App\Models\Submission;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Owners propose changes to their listing; staff approve them before they go
 * live (SubmissionService::approve()). Only fields that differ from the live
 * listing are stored, so approving an older proposal never reverts unrelated
 * changes made since.
 */
class OwnerEditService
{
    /** Columns an owner may change. */
    public const ATTRIBUTES = [
        'tagline', 'description', 'address_line', 'locality', 'pincode',
        'phone', 'whatsapp', 'email', 'website', 'price_range', 'amenities', 'payment_methods',
        'logo_media_id', 'cover_media_id',
    ];

    /** Child rows an owner may replace. */
    public const RELATIONS = ['hours', 'services', 'social_links', 'photos'];

    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * The live values of every owner-editable field, in the shape the edit form sends.
     *
     * @return array<string, mixed>
     */
    public function snapshot(Business $business): array
    {
        $business->loadMissing(['hours', 'services', 'socialLinks', 'approvedPhotos']);

        $values = [];
        foreach (self::ATTRIBUTES as $key) {
            $values[$key] = $business->getAttribute($key);
        }

        $values['hours'] = $business->hours->map(fn (BusinessHour $h) => [
            'day_of_week' => $h->day_of_week,
            'is_closed' => $h->is_closed,
            'opens_at' => $h->opens_at ? substr($h->opens_at, 0, 5) : null,
            'closes_at' => $h->closes_at ? substr($h->closes_at, 0, 5) : null,
        ])->values()->all();

        $values['services'] = $business->services->map(fn (BusinessService $s) => [
            'name' => $s->name,
            'description' => $s->description,
            'price_min_paise' => $s->price_min_paise,
            'price_max_paise' => $s->price_max_paise,
        ])->values()->all();

        $values['social_links'] = $business->socialLinks->map(fn ($l) => [
            'platform' => $l->platform,
            'url' => $l->url,
        ])->values()->all();

        $values['photos'] = $business->approvedPhotos->map(fn ($p) => [
            'media_id' => $p->media_id,
            'caption' => $p->caption,
        ])->values()->all();

        return $values;
    }

    /**
     * Fields of the proposal that differ from the live listing.
     *
     * @param  array<string, mixed>  $proposal
     * @return array<string, mixed>
     */
    public function changes(Business $business, array $proposal): array
    {
        $current = $this->snapshot($business);

        return collect($proposal)
            ->map(fn ($value, $key) => $this->normalize($key, $value))
            ->reject(fn ($value, $key) => $value == $this->normalize($key, $current[$key] ?? null))
            ->all();
    }

    /**
     * Store the owner's changes for review, replacing any proposal still waiting.
     *
     * @param  array<string, mixed>  $proposal
     */
    public function propose(User $owner, Business $business, array $proposal): Submission
    {
        $changes = $this->changes($business, $proposal);

        if ($changes === []) {
            throw ValidationException::withMessages(['changes' => ['Nothing has changed from your live listing.']]);
        }

        return DB::transaction(function () use ($owner, $business, $changes) {
            $submission = $this->pending($business, $owner) ?? new Submission([
                'type' => SubmissionType::OwnerEdit,
                'entity_type' => $business->getMorphClass(),
                'entity_id' => $business->id,
            ]);
            $replacing = $submission->exists;
            $submission->payload = $changes;
            $submission->user()->associate($owner);
            $submission->save();

            $this->audit->log($replacing ? 'business.owner_edit_updated' : 'business.owner_edit_proposed', $business,
                null, ['submission_id' => $submission->id, 'fields' => array_keys($changes)], $owner);

            return $submission;
        });
    }

    public function pending(Business $business, ?User $owner = null): ?Submission
    {
        return Submission::query()
            ->where('type', SubmissionType::OwnerEdit->value)
            ->where('status', SubmissionStatus::Pending->value)
            ->where('entity_type', $business->getMorphClass())
            ->where('entity_id', $business->id)
            ->when($owner, fn ($q) => $q->where('user_id', $owner->id))
            ->latest()
            ->first();
    }

    private function normalize(string $key, mixed $value): mixed
    {
        if ($value === '' || $value === []) {
            return in_array($key, [...self::RELATIONS, 'amenities', 'payment_methods'], true) ? [] : null;
        }

        return match ($key) {
            'hours' => collect($value)->map(fn ($h) => [
                'day_of_week' => (int) $h['day_of_week'],
                'is_closed' => (bool) ($h['is_closed'] ?? false),
                'opens_at' => ($h['is_closed'] ?? false) ? null : ($h['opens_at'] ?? null),
                'closes_at' => ($h['is_closed'] ?? false) ? null : ($h['closes_at'] ?? null),
            ])->sortBy(fn ($h) => sprintf('%d-%s', $h['day_of_week'], $h['opens_at']))->values()->all(),
            'services' => collect($value)->map(fn ($s) => [
                'name' => $s['name'],
                'description' => $s['description'] ?? null,
                'price_min_paise' => isset($s['price_min_paise']) ? (int) $s['price_min_paise'] : null,
                'price_max_paise' => isset($s['price_max_paise']) ? (int) $s['price_max_paise'] : null,
            ])->values()->all(),
            'social_links' => collect($value)->map(fn ($l) => ['platform' => $l['platform'], 'url' => $l['url']])
                ->sortBy('platform')->values()->all(),
            'photos' => collect($value)->map(fn ($p) => ['media_id' => $p['media_id'], 'caption' => ($p['caption'] ?? null) ?: null])->values()->all(),
            'price_range' => $value === null ? null : (int) $value,
            default => $value,
        };
    }
}
