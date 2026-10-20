<?php

namespace App\Console\Commands;

use App\Models\AiRun;
use App\Services\AI\AiSettings;
use App\Services\DataEngine\BusinessDiscovery;
use Illuminate\Console\Command;

/**
 * Daily discovery of new Dehradun businesses (scheduled at 1 AM IST in
 * routes/console.php). Found businesses wait in Admin > AI discoveries.
 */
class DiscoverBusinesses extends Command
{
    protected $signature = 'doon:discover
        {--category= : Only this category slug (e.g. cafes)}
        {--scheduled : The nightly run; skipped while discovery is switched off}
        {--queued : Carry out a run staff requested from the admin, if any}';

    protected $description = 'Find new Dehradun businesses (OpenStreetMap + web search) and queue them for review';

    public function handle(BusinessDiscovery $discovery, AiSettings $settings): int
    {
        if ($this->option('queued')) {
            $run = AiRun::where('status', AiRun::QUEUED)->oldest()->first();
            if (! $run) {
                return self::SUCCESS;
            }
            $run = $discovery->run('manual', queued: $run);
        } else {
            if ($this->option('scheduled') && ! $settings->get('discovery_enabled')) {
                $this->info('Daily discovery is switched off (Admin > AI settings).');

                return self::SUCCESS;
            }
            $run = $discovery->run($this->option('scheduled') ? 'schedule' : 'console', onlyCategory: $this->option('category') ?: null);
        }

        $this->info("Run {$run->id}: {$run->status}, {$run->found_count} businesses queued for review.");
        if ($run->error) {
            $this->error($run->error);
        }

        return $run->status === AiRun::COMPLETED ? self::SUCCESS : self::FAILURE;
    }
}
