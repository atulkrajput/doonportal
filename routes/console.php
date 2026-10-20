<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Needs the server cron: * * * * * cd /path/to/app && php artisan schedule:run

// Nightly: find new Dehradun businesses and queue them for staff review.
Schedule::command('doon:discover --scheduled')
    ->dailyAt('01:00')->timezone('Asia/Kolkata')
    ->withoutOverlapping(180);

// "Run now" from Admin > AI discoveries.
Schedule::command('doon:discover --queued')
    ->everyMinute()
    ->withoutOverlapping(180);
