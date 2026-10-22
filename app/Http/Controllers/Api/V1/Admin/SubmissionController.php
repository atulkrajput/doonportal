<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\SubmissionStatus;
use App\Enums\SubmissionType;
use App\Http\Controllers\Api\V1\Account\OwnerBusinessController;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\ModerationDecisionRequest;
use App\Http\Resources\Account\SubmissionResource;
use App\Models\Area;
use App\Models\Business;
use App\Models\Category;
use App\Models\Submission;
use App\Services\Community\OwnerEditService;
use App\Services\Community\SubmissionService;
use App\Services\Discovery\DiscoveryQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/**
 * Submissions queue (submissions.moderate): new listings from members and
 * owners' proposed edits.
 */
class SubmissionController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(SubmissionStatus::values())],
            'type' => ['nullable', Rule::in(SubmissionType::values())],
        ]);
        $term = trim((string) $request->validated('q'));

        $query = Submission::query()->with(['user:id,name,email,phone', 'reviewer:id,name', 'entity'])
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->filterValue('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($term !== '', fn ($q) => $q->whereHas('user', fn ($u) => app(DiscoveryQuery::class)->applyText($u, $term, ['name', 'email'])));

        return SubmissionResource::collection($this->paginate($query, $request, []));
    }

    /**
     * The submission plus what a reviewer needs to decide: the live values an
     * edit would replace, or the names behind a new listing's ids and listings
     * that may be duplicates.
     */
    public function show(Submission $submission, OwnerEditService $edits): JsonResponse
    {
        $submission->load(['user:id,name,email,phone', 'reviewer:id,name', 'entity']);
        $context = [];

        if ($submission->type === SubmissionType::OwnerEdit && $submission->entity instanceof Business) {
            $context['current'] = Arr::only($edits->snapshot($submission->entity), array_keys($submission->payload));
            $context['media'] = OwnerBusinessController::mediaUrls([$context['current'], $submission->payload]);
        }

        if ($submission->type === SubmissionType::Business) {
            $p = $submission->payload;
            $context['category'] = Category::withTrashed()->find($p['category_id'] ?? null, ['id', 'name'])?->name;
            $context['area'] = isset($p['area_id']) ? Area::withTrashed()->find($p['area_id'], ['id', 'name'])?->name : null;
            $words = collect(preg_split('/\s+/', mb_strtolower($p['name'] ?? '')))->filter(fn ($w) => mb_strlen($w) > 3)->take(3);
            $context['possible_duplicates'] = $words->isEmpty() ? [] : Business::query()
                ->where(fn ($q) => $words->each(fn ($w) => app(DiscoveryQuery::class)->applyText($q, $w, ['name'])))
                ->limit(5)->get(['id', 'name', 'slug', 'locality', 'owner_id'])
                ->map(fn (Business $b) => ['id' => $b->id, 'name' => $b->name, 'slug' => $b->slug, 'locality' => $b->locality, 'is_claimed' => $b->owner_id !== null]);
        }

        return response()->json(['data' => (new SubmissionResource($submission))->resolve() + ['context' => $context]]);
    }

    public function approve(ModerationDecisionRequest $request, Submission $submission, SubmissionService $submissions, OwnerEditService $edits): JsonResponse
    {
        $submissions->approve($submission, $request->user(), $request->validated('notes'));

        return $this->show($submission->refresh(), $edits);
    }

    public function reject(ModerationDecisionRequest $request, Submission $submission, SubmissionService $submissions, OwnerEditService $edits): JsonResponse
    {
        $submissions->reject($submission, $request->user(), $request->validated('notes'));

        return $this->show($submission->refresh(), $edits);
    }
}
