<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Support\Arr;

/**
 * Writes a business and its related rows (categories, areas, hours, services,
 * social links) with one audit entry. Used by the admin API and when an
 * owner's proposed edit or a submitted listing is approved.
 */
class BusinessWriter
{
    public const ATTRIBUTES = [
        'name', 'slug', 'tagline', 'description', 'is_published', 'is_featured',
        'address_line', 'locality', 'city', 'pincode', 'primary_area_id', 'latitude', 'longitude',
        'phone', 'whatsapp', 'email', 'website', 'price_range', 'amenities', 'payment_methods',
        'logo_media_id', 'cover_media_id', 'opened_on', 'last_verified_at', 'source_name', 'source_url',
    ];

    public const HOUR_FIELDS = ['day_of_week', 'opens_at', 'closes_at', 'is_closed'];

    public const SERVICE_FIELDS = ['name', 'description', 'price_min_paise', 'price_max_paise', 'sort_order'];

    public const SOCIAL_FIELDS = ['platform', 'url'];

    public const PHOTO_FIELDS = ['media_id', 'caption', 'status', 'sort_order'];

    public function __construct(private readonly AuditedWriter $writer) {}

    /**
     * @param  array<string, mixed>  $data  validated input: model attributes plus any of
     *                                      category_ids, primary_category_id, area_ids, hours, services, social_links
     */
    public function save(Business $business, array $data, ?string $action = null): Business
    {
        $attributes = Arr::only($data, self::ATTRIBUTES);

        // A blank slug means "keep / generate one", never "clear it".
        if (array_key_exists('slug', $attributes) && blank($attributes['slug'])) {
            unset($attributes['slug']);
        }

        /** @var Business */
        return $this->writer->save($business, $attributes, $this->relationSyncs($data), $action);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, callable(Business): array{0: mixed, 1: mixed}>
     */
    private function relationSyncs(array $data): array
    {
        $syncs = [];

        if (array_key_exists('category_ids', $data)) {
            $primary = $data['primary_category_id'] ?? ($data['category_ids'][0] ?? null);
            $ids = collect($data['category_ids'])->mapWithKeys(fn ($id) => [$id => ['is_primary' => $id === $primary]])->all();
            $syncs['category_ids'] = fn (Business $b) => $this->writer->syncIds($b->categories(), $ids);
        }
        if (array_key_exists('area_ids', $data)) {
            $syncs['area_ids'] = fn (Business $b) => $this->writer->syncIds($b->areas(), $data['area_ids']);
        }
        if (array_key_exists('hours', $data)) {
            $rows = collect($data['hours'])->map(fn ($h) => [
                'day_of_week' => $h['day_of_week'],
                'is_closed' => (bool) ($h['is_closed'] ?? false),
                'opens_at' => ($h['is_closed'] ?? false) ? null : $h['opens_at'],
                'closes_at' => ($h['is_closed'] ?? false) ? null : $h['closes_at'],
            ])->all();
            $syncs['hours'] = fn (Business $b) => $this->writer->replaceChildren($b->hours(), $rows, self::HOUR_FIELDS);
        }
        if (array_key_exists('services', $data)) {
            $rows = collect($data['services'])->values()->map(fn ($s, $i) => [...$s, 'sort_order' => $i])->all();
            $syncs['services'] = fn (Business $b) => $this->writer->replaceChildren($b->services(), $rows, self::SERVICE_FIELDS);
        }
        if (array_key_exists('photos', $data)) {
            $rows = collect($data['photos'])->values()->map(fn ($p, $i) => [
                'media_id' => $p['media_id'], 'caption' => $p['caption'] ?? null, 'status' => 'APPROVED', 'sort_order' => $i,
            ])->all();
            $syncs['photos'] = fn (Business $b) => $this->writer->replaceChildren($b->photos(), $rows, self::PHOTO_FIELDS);
        }
        if (array_key_exists('social_links', $data)) {
            $syncs['social_links'] = fn (Business $b) => $this->writer->replaceChildren($b->socialLinks(), $data['social_links'], self::SOCIAL_FIELDS);
        }

        return $syncs;
    }
}
