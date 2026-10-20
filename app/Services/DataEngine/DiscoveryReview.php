<?php

namespace App\Services\DataEngine;

use App\Models\Admin;
use App\Models\AiDiscovery;
use App\Models\Area;
use App\Models\Business;
use App\Services\AuditLogger;
use App\Services\BusinessWriter;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Staff decisions on discovered businesses. Approval creates a published,
 * UNVERIFIED listing through the same writer as admin edits, credited to its
 * source (never labelled verified because a machine found it).
 */
class DiscoveryReview
{
    /** Fields staff may correct before approving. */
    public const EDITABLE = ['description', 'address_line', 'locality', 'pincode', 'phone', 'whatsapp', 'email', 'website'];

    public function __construct(private readonly BusinessWriter $businesses, private readonly AuditLogger $audit) {}

    /**
     * @param  array<string, mixed>  $changes  validated: name, category_id and EDITABLE fields
     */
    public function edit(AiDiscovery $discovery, array $changes, Admin $actor): AiDiscovery
    {
        $this->assertPending($discovery);

        return DB::transaction(function () use ($discovery, $changes, $actor) {
            $old = ['name' => $discovery->name, 'category_id' => $discovery->category_id, ...array_intersect_key($discovery->data, array_flip(self::EDITABLE))];
            $data = $discovery->data;
            foreach (self::EDITABLE as $field) {
                if (array_key_exists($field, $changes)) {
                    $data[$field] = $changes[$field] === '' ? null : $changes[$field];
                }
            }
            $discovery->forceFill([
                'name' => $changes['name'] ?? $discovery->name,
                'category_id' => $changes['category_id'] ?? $discovery->category_id,
                'data' => $data,
            ])->save();

            $new = ['name' => $discovery->name, 'category_id' => $discovery->category_id, ...array_intersect_key($data, array_flip(self::EDITABLE))];
            $this->audit->log('ai_discovery.edited', $discovery, $old, $new, $actor);

            return $discovery;
        });
    }

    public function approve(AiDiscovery $discovery, Admin $actor): Business
    {
        $this->assertPending($discovery);

        if ($discovery->category_id === null) {
            throw ValidationException::withMessages(['category_id' => ['Choose a category before approving.']]);
        }

        return DB::transaction(function () use ($discovery, $actor) {
            $d = $discovery->data;
            $osm = $discovery->source === 'osm';
            $area = $this->area($d['locality'] ?? null, $d['address_line'] ?? null);

            $business = $this->businesses->save(new Business, array_filter([
                'name' => $discovery->name,
                'description' => $d['description'] ?? null,
                'address_line' => $d['address_line'] ?? null,
                'locality' => $d['locality'] ?? null,
                'city' => 'Dehradun',
                'pincode' => $d['pincode'] ?? null,
                'primary_area_id' => $area?->id,
                'latitude' => $d['latitude'] ?? null,
                'longitude' => $d['longitude'] ?? null,
                'phone' => $d['phone'] ?? null,
                'whatsapp' => $d['whatsapp'] ?? null,
                'email' => $d['email'] ?? null,
                'website' => $d['website'] ?? null,
                'amenities' => ($d['amenities'] ?? []) ?: null,
                'payment_methods' => ($d['payment_methods'] ?? []) ?: null,
                'is_published' => true,
                'source_name' => $osm ? 'OpenStreetMap contributors' : ('Web: '.parse_url((string) ($discovery->evidence['url'] ?? ''), PHP_URL_HOST)),
                'source_url' => $discovery->evidence['url'] ?? null,
                'category_ids' => [$discovery->category_id],
                'primary_category_id' => $discovery->category_id,
                'area_ids' => $area ? [$area->id] : null,
                'hours' => $d['hours'] ?? null,
            ], fn ($v) => $v !== null), 'business.created_from_discovery');

            $business->forceFill(['metadata' => array_filter([
                'discovery_id' => $discovery->id,
                'discovered_via' => $discovery->source,
                'osm_id' => $osm ? $discovery->external_id : null,
                'opening_hours_raw' => $d['opening_hours'] ?? null,
            ])])->save();

            $discovery->forceFill([
                'status' => AiDiscovery::APPROVED,
                'business_id' => $business->id,
                'reviewer_id' => $actor->id,
                'reviewed_at' => now(),
            ])->save();
            $this->audit->log('ai_discovery.approved', $discovery, null, ['business_id' => $business->id], $actor);

            return $business;
        });
    }

    public function reject(AiDiscovery $discovery, Admin $actor, ?string $notes = null, ?string $duplicateOf = null): AiDiscovery
    {
        $this->assertPending($discovery);

        return DB::transaction(function () use ($discovery, $actor, $notes, $duplicateOf) {
            $status = $duplicateOf ? AiDiscovery::DUPLICATE : AiDiscovery::REJECTED;
            $discovery->forceFill([
                'status' => $status,
                'duplicate_of_id' => $duplicateOf,
                'reviewer_id' => $actor->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
            ])->save();
            $this->audit->log('ai_discovery.'.strtolower($status), $discovery, null, ['notes' => $notes, 'duplicate_of_id' => $duplicateOf], $actor);

            return $discovery;
        });
    }

    /**
     * Match a locality like "Rajpur Road" to one of our areas.
     */
    private function area(?string ...$texts): ?Area
    {
        $haystack = mb_strtolower(implode(' ', array_filter($texts)));
        if ($haystack === '') {
            return null;
        }

        return Area::query()->orderByRaw('LENGTH(name) DESC')->get(['id', 'name'])
            ->first(fn (Area $a) => str_contains($haystack, mb_strtolower($a->name)));
    }

    private function assertPending(AiDiscovery $discovery): void
    {
        if ($discovery->status !== AiDiscovery::PENDING) {
            throw ValidationException::withMessages(['discovery' => ['This discovery has already been reviewed.']]);
        }
    }
}
