<?php

namespace App\Services\DataEngine;

use App\Models\AiRunLog;
use App\Services\AI\AiSettings;
use Illuminate\Support\Carbon;

/**
 * Spreads the monthly web search plan (Tavily: e.g. 1,000 a month) evenly:
 * each day may use its fair share of what is left this month, so the plan
 * never runs out early. Every search attempt (runs and the key test) is
 * counted from the run log.
 */
class WebSearchBudget
{
    public function __construct(private readonly AiSettings $settings) {}

    public function monthlyLimit(): int
    {
        return (int) $this->settings->get('web_searches_per_month');
    }

    public function usedThisMonth(): int
    {
        return $this->count($this->monthStart());
    }

    public function usedToday(): int
    {
        return $this->count($this->dayStart());
    }

    /**
     * Searches still allowed today: (monthly limit − used before today) ÷ days
     * left in the month including today, minus what today already used.
     */
    public function allowanceToday(): int
    {
        $usedBeforeToday = $this->usedThisMonth() - $this->usedToday();
        $remaining = max(0, $this->monthlyLimit() - $usedBeforeToday);
        $now = now('Asia/Kolkata');
        $daysLeft = $now->daysInMonth - $now->day + 1;

        return max(0, intdiv($remaining, max(1, $daysLeft)) - $this->usedToday());
    }

    /**
     * @return array{monthly_limit: int, used_this_month: int, used_today: int, allowance_today: int}
     */
    public function summary(): array
    {
        return [
            'monthly_limit' => $this->monthlyLimit(),
            'used_this_month' => $this->usedThisMonth(),
            'used_today' => $this->usedToday(),
            'allowance_today' => $this->allowanceToday(),
        ];
    }

    private function count(Carbon $since): int
    {
        return AiRunLog::where('service', 'web')->where('created_at', '>=', $since)->count();
    }

    private function monthStart(): Carbon
    {
        return now('Asia/Kolkata')->startOfMonth()->utc();
    }

    private function dayStart(): Carbon
    {
        return now('Asia/Kolkata')->startOfDay()->utc();
    }
}
