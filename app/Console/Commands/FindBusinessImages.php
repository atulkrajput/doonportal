<?php

namespace App\Console\Commands;

use App\Models\AiDiscovery;
use App\Models\Business;
use App\Services\AuditLogger;
use App\Services\BusinessImages\BusinessImageStore;
use App\Services\DataEngine\ImageFinder;
use Illuminate\Console\Command;
use Throwable;

/**
 * Backfill cover images for published businesses that have none, from the
 * same sources as discovery: a Wikimedia Commons photo linked on
 * OpenStreetMap, or the business's own website share image. Staff can
 * replace or remove a cover from Admin > Businesses.
 */
class FindBusinessImages extends Command
{
    protected $signature = 'doon:business-images
        {--limit=50 : At most this many businesses per run}
        {--dry-run : Show what would be added without saving anything}';

    protected $description = 'Add cover images to businesses that have none (Wikimedia Commons via OpenStreetMap, or the business website)';

    public function handle(ImageFinder $finder, BusinessImageStore $images, AuditLogger $audit): int
    {
        $businesses = Business::query()->public()->whereNull('cover_media_id')
            ->where(fn ($q) => $q->whereNotNull('website')->orWhere('metadata', 'like', '%discovery_id%'))
            ->orderBy('created_at')->limit((int) $this->option('limit'))->get();

        $added = 0;
        foreach ($businesses as $business) {
            $discovery = isset($business->metadata['discovery_id']) ? AiDiscovery::find($business->metadata['discovery_id']) : null;
            $candidate = [
                'source' => $discovery?->source ?? 'web',
                'name' => $business->name,
                'data' => ['website' => $business->website],
                'evidence' => $discovery?->evidence ?? [],
            ];

            $image = $finder->find($candidate);
            if (! $image) {
                $this->line("  – {$business->name}: no usable image found");

                continue;
            }
            if ($this->option('dry-run')) {
                $this->info("  + {$business->name}: {$image['url']} ({$image['credit']})");

                continue;
            }

            try {
                $media = $images->storeFromUrl($image['url'], $business, 'cover', ['alt_text' => $business->name, 'credit' => $image['credit']]);
                $business->forceFill(['cover_media_id' => $media->id])->save();
                $audit->log('business.cover_added', $business, null, ['media_id' => $media->id, 'source' => $image['source'], 'via' => 'backfill']);
                $this->info("  + {$business->name}: {$media->path}");
                $added++;
            } catch (Throwable $e) {
                $this->warn("  ! {$business->name}: {$e->getMessage()}");
            }
        }

        $this->info("Checked {$businesses->count()} businesses, added {$added} cover image(s).");

        return self::SUCCESS;
    }
}
