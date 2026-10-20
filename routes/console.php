<?php

use App\Services\DataEngine\SchedulerHealth;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Needs the server cron: * * * * * cd /path/to/app && php artisan schedule:run

// Heartbeat so Admin > Discovery runs can show whether the cron is working.
Schedule::call(fn () => app(SchedulerHealth::class)->tick())->everyMinute()->name('scheduler-heartbeat');

// Nightly: find new Dehradun businesses and queue them for staff review.
Schedule::command('doon:discover --scheduled')
    ->dailyAt('01:00')->timezone('Asia/Kolkata')
    ->withoutOverlapping(180);

// A "Run now" from the admin that has not started yet (backup for the in-request start).
Schedule::command('doon:discover --queued')
    ->everyMinute()
    ->withoutOverlapping(180);
