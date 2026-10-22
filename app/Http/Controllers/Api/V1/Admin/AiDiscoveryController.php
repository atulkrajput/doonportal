<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\CategoryType;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Models\AiDiscovery;
use App\Models\AiRun;
use App\Models\AiRunLog;
use App\Services\AI\AiSettings;
use App\Services\DataEngine\BusinessDiscovery;
use App\Services\DataEngine\DiscoveryReview;
use App\Services\DataEngine\SchedulerHealth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Admin > AI discoveries (ai.manage): businesses found by the daily run,
 * reviewed by staff before anything is published.
 */
class AiDiscoveryController extends AdminController
{
    public function index(AdminIndexRequest $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', Rule::in([...AiDiscovery::STATUSES, 'ALL'])],
            'source' => ['nullable', Rule::in(['osm', 'web'])],
        ]);
        $status = $request->filterValue('status') ?? AiDiscovery::PENDING;

        $query = AiDiscovery::query()->with(['category:id,name,slug', 'reviewer:id,name', 'business:id,name,slug', 'duplicateOf:id,name,slug'])
            ->when($status !== 'ALL', fn ($q) => $q->where('status', $status))
            ->when($request->query('source'), fn ($q, $source) => $q->where('source', $source))
            ->when($request->filterValue('category_id'), fn ($q, $id) => $q->where('category_id', $id));

        $page = $this->paginate($query, $request, ['name']);

        return response()->json([
            'data' => $page->getCollection()->map(fn (AiDiscovery $d) => $this->present($d)),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
            'counts' => AiDiscovery::query()->select('status', DB::raw('COUNT(*) as total'))->groupBy('status')->toBase()->pluck('total', 'status'),
        ]);
    }

    public function update(Request $request, AiDiscovery $discovery, DiscoveryReview $review): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'category_id' => ['sometimes', 'required', 'string', Rule::exists('categories', 'id')->where('type', CategoryType::Business->value)->whereNull('deleted_at')],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'address_line' => ['sometimes', 'nullable', 'string', 'max:255'],
            'locality' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pincode' => ['sometimes', 'nullable', 'regex:/^[1-9][0-9]{5}$/'],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:/^\+?[0-9][0-9 \-]{6,18}$/'],
            'whatsapp' => ['sometimes', 'nullable', 'string', 'regex:/^\+?[0-9][0-9 \-]{6,18}$/'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'website' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'remove_image' => ['sometimes', 'boolean'],
            'image_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'image_credit' => ['sometimes', 'nullable', 'string', 'max:240'],
        ]);

        return response()->json(['data' => $this->present($review->edit($discovery, $data, $request->user())->load(['category:id,name,slug']))]);
    }

    public function approve(Request $request, AiDiscovery $discovery, DiscoveryReview $review): JsonResponse
    {
        $review->approve($discovery, $request->user());

        return response()->json(['data' => $this->present($discovery->refresh()->load(['category:id,name,slug', 'business:id,name,slug']))]);
    }

    public function reject(Request $request, AiDiscovery $discovery, DiscoveryReview $review): JsonResponse
    {
        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
            'duplicate_of_id' => ['nullable', 'string', Rule::exists('businesses', 'id')],
        ]);
        $review->reject($discovery, $request->user(), $data['notes'] ?? null, $data['duplicate_of_id'] ?? null);

        return response()->json(['data' => $this->present($discovery->refresh()->load(['category:id,name,slug', 'duplicateOf:id,name,slug']))]);
    }

    /**
     * Approve or reject several at once. Each is handled on its own, so one
     * failure (e.g. no category) does not stop the rest.
     */
    public function bulk(Request $request, DiscoveryReview $review): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'reject'])],
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['string', 'distinct'],
        ]);

        $done = 0;
        $failed = [];
        AiDiscovery::whereIn('id', $data['ids'])->where('status', AiDiscovery::PENDING)->get()
            ->each(function (AiDiscovery $d) use ($data, $review, $request, &$done, &$failed) {
                try {
                    $data['action'] === 'approve' ? $review->approve($d, $request->user()) : $review->reject($d, $request->user());
                    $done++;
                } catch (ValidationException $e) {
                    $failed[] = ['id' => $d->id, 'name' => $d->name, 'error' => collect($e->errors())->flatten()->first()];
                }
            });

        return response()->json(['data' => ['done' => $done, 'failed' => $failed]]);
    }

    public function runs(AdminIndexRequest $request): JsonResponse
    {
        $page = $this->paginate(AiRun::query()->with('requester:id,name'), $request, []);

        return response()->json([
            'data' => $page->getCollection()->map(fn (AiRun $r) => [
                'id' => $r->id,
                'trigger' => $r->trigger,
                'status' => $r->status,
                'category_slug' => $r->category_slug,
                'found_count' => $r->found_count,
                'ai_tokens' => $r->ai_tokens,
                'stats' => $r->stats,
                'error' => $r->error,
                'requested_by' => $r->requester?->name,
                'started_at' => $r->started_at?->toIso8601String(),
                'finished_at' => $r->finished_at?->toIso8601String(),
                'created_at' => $r->created_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    /**
     * Cron health and today's runs, for Admin > Discovery runs.
     */
    public function status(SchedulerHealth $health, AiSettings $settings): JsonResponse
    {
        return response()->json(['data' => $health->status($settings)]);
    }

    /**
     * Run the discovery now, once a day. It starts right after this response
     * (so it works even when the cron is not set up); if the server stops it
     * from starting, the scheduler's --queued check picks it up instead.
     */
    public function runNow(Request $request, SchedulerHealth $health): JsonResponse
    {
        $data = $request->validate(['category_slug' => ['nullable', 'string', Rule::in(array_keys(config('discovery.categories')))]]);

        $health->closeStaleRuns();
        if ($health->activeRun()) {
            throw ValidationException::withMessages(['run' => ['A discovery run is already in progress.']]);
        }
        if ($health->manualRunToday()) {
            throw ValidationException::withMessages(['run' => ['Today’s manual run has completed. It resets at midnight (IST); a run that failed or was stopped can be retried.']]);
        }

        $run = new AiRun(['trigger' => 'manual', 'status' => AiRun::QUEUED, 'category_slug' => $data['category_slug'] ?? null]);
        $run->requester()->associate($request->user());
        $run->save();
        $this->audit->log('ai.discovery_requested', $run, null, ['category_slug' => $run->category_slug]);

        $id = $run->id;
        dispatch(function () use ($id) {
            @set_time_limit(0);
            ignore_user_abort(true);
            $queued = AiRun::find($id);
            if ($queued?->status === AiRun::QUEUED) {
                app(BusinessDiscovery::class)->run('manual', queued: $queued);
            }
        })->afterResponse();

        return response()->json(['data' => ['id' => $run->id, 'status' => $run->status]], 202);
    }

    /**
     * Ask a run to stop after the category it is on (or cancel it if it has not started).
     */
    public function stop(AiRun $run): JsonResponse
    {
        if ($run->status === AiRun::QUEUED) {
            $run->forceFill(['status' => AiRun::STOPPED, 'finished_at' => now(), 'error' => 'Cancelled by staff before it started.'])->save();
        } elseif ($run->status === AiRun::RUNNING) {
            $run->forceFill(['status' => AiRun::STOPPING])->save();
            AiRunLog::create(['run_id' => $run->id, 'service' => 'run', 'level' => 'warning', 'message' => 'Stop requested by staff; ending after the current category.']);
        } else {
            throw ValidationException::withMessages(['run' => ['This run is not in progress.']]);
        }
        $this->audit->log('ai.discovery_stopped', $run);

        return response()->json(['data' => ['id' => $run->id, 'status' => $run->status]]);
    }

    /**
     * Step-by-step log of a run (oldest first). ?after=<log id> returns only newer lines.
     */
    public function logs(Request $request, AiRun $run): JsonResponse
    {
        $after = $request->validate(['after' => ['nullable', 'string', 'size:26']])['after'] ?? null;

        $logs = AiRunLog::where('run_id', $run->id)
            ->when($after, fn ($q) => $q->where('id', '>', $after))
            ->orderBy('created_at')->orderBy('id')->limit(500)->get();

        return response()->json(['data' => $logs->map(fn (AiRunLog $l) => [
            'id' => $l->id,
            'at' => $l->created_at?->toIso8601String(),
            'service' => $l->service,
            'level' => $l->level,
            'category' => $l->category_slug,
            'message' => $l->message,
            'http_status' => $l->http_status,
            'duration_ms' => $l->duration_ms,
            'tokens' => $l->tokens,
        ]), 'run' => ['status' => $run->refresh()->status, 'found_count' => $run->found_count]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(AiDiscovery $d): array
    {
        return [
            'id' => $d->id,
            'source' => $d->source,
            'external_id' => $d->external_id,
            'status' => $d->status,
            'name' => $d->name,
            'category' => $d->category ? ['id' => $d->category->id, 'name' => $d->category->name, 'slug' => $d->category->slug] : null,
            'data' => $d->data,
            'evidence' => $d->evidence,
            'ai' => $d->ai,
            'business' => $d->relationLoaded('business') && $d->business ? ['id' => $d->business->id, 'name' => $d->business->name, 'slug' => $d->business->slug] : null,
            'duplicate_of' => $d->relationLoaded('duplicateOf') && $d->duplicateOf ? ['id' => $d->duplicateOf->id, 'name' => $d->duplicateOf->name, 'slug' => $d->duplicateOf->slug] : null,
            'reviewer' => $d->relationLoaded('reviewer') ? $d->reviewer?->name : null,
            'reviewed_at' => $d->reviewed_at?->toIso8601String(),
            'review_notes' => $d->review_notes,
            'created_at' => $d->created_at?->toIso8601String(),
        ];
    }
}
