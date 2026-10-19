<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\EntityType;
use App\Http\Controllers\Controller;
use App\Models\AnalyticsEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * First-party analytics from analytics_events (no IPs or user agents are stored;
 * visitors are a daily-rotating HMAC hash). Dates are in IST.
 */
class AnalyticsReportController extends Controller
{
    private const TZ = 'Asia/Kolkata';

    private const MAX_DAYS = 366;

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $to = Carbon::parse($data['to'] ?? now(self::TZ)->toDateString(), self::TZ)->endOfDay();
        $from = Carbon::parse($data['from'] ?? $to->copy()->subDays(29)->toDateString(), self::TZ)->startOfDay();
        if ($from->diffInDays($to) > self::MAX_DAYS) {
            $from = $to->copy()->subDays(self::MAX_DAYS)->startOfDay();
        }
        $range = [$from->copy()->utc(), $to->copy()->utc()];
        $base = fn () => AnalyticsEvent::query()->whereBetween('created_at', $range);

        $byName = $base()->select('name', DB::raw('COUNT(*) as total'))->groupBy('name')->orderByDesc('total')
            ->pluck('total', 'name')->map(fn ($n) => (int) $n);

        // Daily series bucketed in PHP (IST) for portability; capped by MAX_DAYS.
        $daily = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $daily[$d->toDateString()] = ['date' => $d->toDateString(), 'page_views' => 0, 'events' => 0, 'visitors' => []];
        }
        $base()->select(['name', 'session_hash', 'created_at'])->orderBy('created_at')
            ->chunk(2000, function ($rows) use (&$daily) {
                foreach ($rows as $row) {
                    $day = $row->created_at->copy()->setTimezone(self::TZ)->toDateString();
                    if (! isset($daily[$day])) {
                        continue;
                    }
                    $daily[$day]['events']++;
                    if (($row->name->value ?? $row->name) === 'page_view') {
                        $daily[$day]['page_views']++;
                    }
                    if ($row->session_hash) {
                        $daily[$day]['visitors'][$row->session_hash] = true;
                    }
                }
            });
        $daily = array_values(array_map(fn ($d) => [...$d, 'visitors' => count($d['visitors'])], $daily));

        $topPages = $base()->where('name', 'page_view')->get(['properties'])
            ->countBy(fn ($e) => (string) ($e->properties['path'] ?? '/'))
            ->sortDesc()->take(15)->map(fn ($n, $path) => ['path' => $path, 'views' => $n])->values();

        $topEntities = $base()->whereNotNull('entity_type')
            ->select('entity_type', 'entity_id', DB::raw('COUNT(*) as total'))
            ->groupBy('entity_type', 'entity_id')->orderByDesc('total')->limit(15)->get();
        $labels = [];
        foreach ($topEntities->groupBy('entity_type') as $type => $rows) {
            $class = EntityType::tryFrom($type)?->modelClass();
            if ($class) {
                $titleColumn = in_array($type, ['event', 'story', 'collection'], true) ? 'title' : 'name';
                $labels += $class::withoutGlobalScopes()->whereIn('id', $rows->pluck('entity_id'))->pluck($titleColumn, 'id')->all();
            }
        }

        $topSearches = $base()->where('name', 'search_performed')->get(['properties'])
            ->countBy(fn ($e) => mb_strtolower(trim((string) ($e->properties['query'] ?? ''))))
            ->forget('')->sortDesc()->take(15)->map(fn ($n, $q) => ['query' => $q, 'searches' => $n])->values();

        return response()->json(['data' => [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'totals' => [
                'events' => $byName->sum(),
                'page_views' => $byName->get('page_view', 0),
                'visitors' => (int) $base()->whereNotNull('session_hash')->distinct()->count('session_hash'),
            ],
            'by_event' => $byName->map(fn ($n, $name) => ['name' => $name, 'total' => $n])->values(),
            'daily' => $daily,
            'top_pages' => $topPages,
            'top_entities' => $topEntities->map(fn ($e) => [
                'type' => $e->entity_type,
                'id' => $e->entity_id,
                'label' => $labels[$e->entity_id] ?? '(deleted)',
                'total' => (int) $e->total,
            ]),
            'top_searches' => $topSearches,
            'note' => 'Visitors are counted per day per anonymous hash; a person visiting on two days counts twice in the range total.',
        ]]);
    }
}
