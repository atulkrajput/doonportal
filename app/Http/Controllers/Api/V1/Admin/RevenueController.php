<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PlanInterval;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Revenue from recorded payments only (subscriptions with paid_at). Amounts
 * are in paise. Months and date filters use India time (IST).
 */
class RevenueController extends Controller
{
    private const TZ = 'Asia/Kolkata';

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $to = Carbon::parse($data['to'] ?? now(self::TZ)->toDateString(), self::TZ)->endOfDay();
        $from = Carbon::parse($data['from'] ?? $to->copy()->subMonthsNoOverflow(11)->startOfMonth()->toDateString(), self::TZ)->startOfDay();

        $paid = Subscription::query()->with('plan:id,name')
            ->whereNotNull('paid_at')->whereBetween('paid_at', [$from->copy()->utc(), $to->copy()->utc()])
            ->get(['id', 'plan_id', 'amount_paise', 'paid_at', 'payment_method']);

        // Bucket by IST month in PHP so the query stays portable across MySQL/SQLite/PostgreSQL.
        $byMonth = [];
        for ($m = $from->copy()->startOfMonth(); $m->lte($to); $m->addMonthNoOverflow()) {
            $byMonth[$m->format('Y-m')] = ['month' => $m->format('Y-m'), 'amount_paise' => 0, 'payments' => 0];
        }
        $byPlan = [];
        $byMethod = [];
        foreach ($paid as $s) {
            $month = $s->paid_at->copy()->setTimezone(self::TZ)->format('Y-m');
            $byMonth[$month]['amount_paise'] = ($byMonth[$month]['amount_paise'] ?? 0) + $s->amount_paise;
            $byMonth[$month]['payments'] = ($byMonth[$month]['payments'] ?? 0) + 1;
            $byMonth[$month]['month'] = $month;

            $plan = $s->plan?->name ?? 'Deleted plan';
            $byPlan[$plan] = ($byPlan[$plan] ?? 0) + $s->amount_paise;
            $method = $s->payment_method?->value ?? 'UNKNOWN';
            $byMethod[$method] = ($byMethod[$method] ?? 0) + $s->amount_paise;
        }

        $today = now(self::TZ)->toDateString();
        $active = Subscription::query()->with('plan:id,interval,price_paise')
            ->where('status', SubscriptionStatus::Active->value)
            ->where(fn ($q) => $q->whereNull('ends_on')->orWhere('ends_on', '>=', $today))
            ->get(['id', 'plan_id', 'amount_paise', 'ends_on', 'business_id']);

        // Monthly recurring revenue: active recurring subscriptions normalised to one month.
        $mrr = (int) round($active->sum(function (Subscription $s) {
            $months = $s->plan?->interval?->months();

            return $months ? $s->amount_paise / $months : 0;
        }));

        $renewals = Subscription::query()->with(['business:id,name', 'plan:id,name'])
            ->where('status', SubscriptionStatus::Active->value)
            ->whereBetween('ends_on', [$today, now(self::TZ)->addDays(30)->toDateString()])
            ->orderBy('ends_on')->limit(20)->get()
            ->map(fn (Subscription $s) => [
                'id' => $s->id,
                'business' => $s->business?->name,
                'plan' => $s->plan?->name,
                'ends_on' => $s->ends_on?->toDateString(),
                'amount_paise' => $s->amount_paise,
            ]);

        arsort($byPlan);
        arsort($byMethod);

        return response()->json(['data' => [
            'currency' => 'INR',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'total_paise' => (int) $paid->sum('amount_paise'),
            'payments' => $paid->count(),
            'mrr_paise' => $mrr,
            'active_subscriptions' => $active->count(),
            'one_time_active' => $active->filter(fn ($s) => $s->plan?->interval === PlanInterval::OneTime)->count(),
            'pending_subscriptions' => Subscription::where('status', SubscriptionStatus::Pending->value)->count(),
            'by_month' => array_values($byMonth),
            'by_plan' => collect($byPlan)->map(fn ($v, $k) => ['plan' => $k, 'amount_paise' => $v])->values(),
            'by_method' => collect($byMethod)->map(fn ($v, $k) => ['method' => $k, 'amount_paise' => $v])->values(),
            'upcoming_renewals' => $renewals,
            'source' => 'Recorded payments only. There is no payment gateway yet.',
        ]]);
    }
}
