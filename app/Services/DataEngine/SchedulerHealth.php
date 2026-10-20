<?php

namespace App\Services\DataEngine;

use App\Models\AiRun;
use App\Services\AI\AiSettings;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Is the server's cron running Laravel's scheduler, and what has the
 * discovery done today? Shown in Admin > Discovery runs.
 */
class SchedulerHealth
{
    private const TICK_KEY = 'scheduler.last_tick';

    /** The scheduler runs every minute; allow a little slack before warning. */
    private const HEALTHY_WITHIN_MINUTES = 3;

    /** A run still "running" after this long was killed by the server. */
    public const STALE_AFTER_HOURS = 3;

    /**
     * Called by the scheduler every minute (routes/console.php).
     */
    public function tick(): void
    {
        Cache::forever(self::TICK_KEY, now()->toIso8601String());
    }

    public function lastTick(): ?Carbon
    {
        $value = Cache::get(self::TICK_KEY);

        return $value ? Carbon::parse($value) : null;
    }

    public function cronHealthy(): bool
    {
        $last = $this->lastTick();

        return $last !== null && $last->gt(now()->subMinutes(self::HEALTHY_WITHIN_MINUTES));
    }

    /**
     * Mark runs the server stopped mid-way (time limit, restart) as failed,
     * so they don't block new runs forever.
     */
    public function closeStaleRuns(): void
    {
        AiRun::whereIn('status', [AiRun::RUNNING, AiRun::QUEUED])
            ->where('created_at', '<', now()->subHours(self::STALE_AFTER_HOURS))
            ->update([
                'status' => AiRun::FAILED,
                'error' => 'Stopped before finishing (the server ended the process). The next run carries on where this one left off.',
                'finished_at' => now(),
            ]);
    }

    public function todayStart(): Carbon
    {
        return now('Asia/Kolkata')->startOfDay()->utc();
    }

    public function manualRunToday(): ?AiRun
    {
        return AiRun::where('trigger', 'manual')->where('created_at', '>=', $this->todayStart())->latest('created_at')->first();
    }

    public function activeRun(): ?AiRun
    {
        return AiRun::whereIn('status', [AiRun::QUEUED, AiRun::RUNNING])->latest('created_at')->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function status(AiSettings $settings): array
    {
        $this->closeStaleRuns();

        $last = $this->lastTick();
        $nightly = AiRun::where('trigger', 'schedule')->latest('created_at')->first();
        $manual = $this->manualRunToday();
        $active = $this->activeRun();
        $next = now('Asia/Kolkata')->setTime(1, 0);
        if ($next->isPast()) {
            $next->addDay();
        }

        $blocked = match (true) {
            $active !== null => 'A discovery run is already in progress.',
            $manual !== null => 'The manual run has already been used today. It resets at midnight (IST).',
            default => null,
        };

        return [
            'cron' => [
                'healthy' => $this->cronHealthy(),
                'last_seen_at' => $last?->toIso8601String(),
                'command' => '* * * * * cd '.base_path().' && php artisan schedule:run >> /dev/null 2>&1',
            ],
            'nightly' => [
                'enabled' => (bool) $settings->get('discovery_enabled'),
                'next_at' => $next->toIso8601String(),
                'last' => $nightly ? $this->summary($nightly) : null,
            ],
            'manual' => [
                'can_run' => $blocked === null,
                'reason' => $blocked,
                'today' => $manual ? $this->summary($manual) : null,
            ],
            'active' => $active ? $this->summary($active) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(AiRun $run): array
    {
        return [
            'id' => $run->id,
            'status' => $run->status,
            'found_count' => $run->found_count,
            'started_at' => $run->started_at?->toIso8601String(),
            'finished_at' => $run->finished_at?->toIso8601String(),
            'created_at' => $run->created_at?->toIso8601String(),
        ];
    }
}
