<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Enums\AnalyticsEventName;
use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\OwnerBusinessEditRequest;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\Account\MyReviewResource;
use App\Http\Resources\Account\SubmissionResource;
use App\Models\AnalyticsEvent;
use App\Models\Business;
use App\Models\Media;
use App\Models\Review;
use App\Models\Submission;
use App\Services\BusinessImages\BusinessImageStore;
use App\Services\Community\OwnerEditService;
use App\Services\Community\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The business owner's tools for listings they own: proposed edits (approved
 * by staff before going live), performance stats and replies to reviews.
 */
class OwnerBusinessController extends Controller
{
    /** Analytics events shown to owners, in display order. */
    private const STAT_EVENTS = [
        AnalyticsEventName::BusinessViewed,
        AnalyticsEventName::BusinessPhoneClicked,
        AnalyticsEventName::BusinessWhatsappClicked,
        AnalyticsEventName::DirectionsClicked,
        AnalyticsEventName::BusinessWebsiteClicked,
        AnalyticsEventName::BusinessSaved,
        AnalyticsEventName::OfferClicked,
    ];

    public function __construct(private readonly OwnerEditService $edits) {}

    public function index(Request $request): JsonResponse
    {
        $businesses = $request->user()->ownedBusinesses()->with(['primaryArea:id,name,slug', 'categories:id,name,slug'])->orderBy('name')->get();
        $ids = $businesses->pluck('id');

        $views = AnalyticsEvent::query()
            ->where('entity_type', 'business')->whereIn('entity_id', $ids)
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('entity_id, name, COUNT(*) as total')->groupBy('entity_id', 'name')->toBase()->get()
            ->groupBy('entity_id');

        $pending = Submission::query()->where('type', 'OWNER_EDIT')->where('status', 'PENDING')
            ->where('entity_type', 'business')->whereIn('entity_id', $ids)->pluck('entity_id')->flip();

        $newReviews = Review::query()->where('reviewable_type', 'business')->whereIn('reviewable_id', $ids)
            ->published()->whereNull('owner_reply')->selectRaw('reviewable_id, COUNT(*) as total')->groupBy('reviewable_id')
            ->pluck('total', 'reviewable_id');

        return response()->json(['data' => $businesses->map(function (Business $b) use ($views, $pending, $newReviews) {
            $counts = ($views[$b->id] ?? collect())->pluck('total', 'name');

            return [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
                'status' => $b->status->value,
                'is_verified' => $b->status->isVerified(),
                'is_published' => $b->is_published,
                'area' => $b->primaryArea?->name,
                'category' => $b->categories->first()?->name,
                'rating' => ['average' => round($b->rating_avg, 1), 'count' => $b->rating_count],
                'has_pending_edit' => $pending->has($b->id),
                'unanswered_reviews' => (int) ($newReviews[$b->id] ?? 0),
                'last_30_days' => [
                    'views' => (int) ($counts[AnalyticsEventName::BusinessViewed->value] ?? 0),
                    'actions' => (int) $counts->except(AnalyticsEventName::BusinessViewed->value)->sum(),
                ],
            ];
        })]);
    }

    public function show(Request $request, Business $business): JsonResponse
    {
        $this->ensureOwner($request, $business);

        $lastDecided = Submission::query()->where('type', 'OWNER_EDIT')->where('entity_type', 'business')
            ->where('entity_id', $business->id)->where('status', '!=', 'PENDING')->latest('reviewed_at')->first();

        return response()->json(['data' => [
            'id' => $business->id,
            'name' => $business->name,
            'slug' => $business->slug,
            'status' => $business->status->value,
            'is_verified' => $business->status->isVerified(),
            'is_published' => $business->is_published,
            'current' => $current = $this->edits->snapshot($business),
            'pending_edit' => ($pending = $this->edits->pending($business)) ? new SubmissionResource($pending) : null,
            'media' => self::mediaUrls([$current, $pending?->payload ?? []]),
            'last_decision' => $lastDecided ? new SubmissionResource($lastDecided) : null,
        ]]);
    }

    /**
     * Upload a logo, cover or gallery photo. It is saved to the business's images
     * but only shows on the listing once staff approve the change that uses it.
     */
    public function uploadImage(Request $request, Business $business, BusinessImageStore $images): JsonResponse
    {
        $this->ensureOwner($request, $business);
        $data = $request->validate([
            'file' => ['required', 'file', 'max:5120', 'mimetypes:image/jpeg,image/png,image/webp'],
            'kind' => ['required', Rule::in(BusinessImageStore::KINDS)],
        ]);

        try {
            $media = $images->storeUpload($data['file'], $business, $data['kind'], ['alt_text' => $business->name]);
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['file' => [$e->getMessage()]]);
        }

        return response()->json(['data' => ['id' => $media->id, 'url' => $media->url(), 'kind' => $data['kind']]], 201);
    }

    /**
     * id => url for every image referenced in these owner-edit value sets.
     *
     * @param  list<array<string, mixed>>  $sets
     * @return array<string, string>
     */
    public static function mediaUrls(array $sets): array
    {
        $ids = collect($sets)->flatMap(fn ($v) => [$v['logo_media_id'] ?? null, $v['cover_media_id'] ?? null, ...array_column($v['photos'] ?? [], 'media_id')])
            ->filter()->unique()->values();

        return Media::whereIn('id', $ids)->get()->mapWithKeys(fn (Media $m) => [$m->id => $m->url()])->all();
    }

    public function proposeEdit(OwnerBusinessEditRequest $request, Business $business): JsonResponse
    {
        $this->ensureOwner($request, $business);

        $submission = $this->edits->propose($request->user(), $business, $request->proposal());

        return (new SubmissionResource($submission))->response()->setStatusCode(201);
    }

    public function stats(Request $request, Business $business): JsonResponse
    {
        $this->ensureOwner($request, $business);
        $request->validate(['days' => ['nullable', 'integer', 'in:7,30,90']]);
        $days = $request->integer('days') ?: 30;
        $since = now('Asia/Kolkata')->startOfDay()->subDays($days - 1)->utc();

        $base = AnalyticsEvent::query()->where('entity_type', 'business')->where('entity_id', $business->id)
            ->where('created_at', '>=', $since);

        $totals = (clone $base)->selectRaw('name, COUNT(*) as total')->groupBy('name')->toBase()->pluck('total', 'name');

        // Daily views in IST. Grouped in PHP so it works the same on MySQL and SQLite.
        $daily = (clone $base)->where('name', AnalyticsEventName::BusinessViewed->value)->toBase()->pluck('created_at')
            ->countBy(fn ($at) => Carbon::parse($at)->setTimezone('Asia/Kolkata')->toDateString());

        $series = collect(range($days - 1, 0))->map(function (int $ago) use ($daily) {
            $date = now('Asia/Kolkata')->subDays($ago)->toDateString();

            return ['date' => $date, 'views' => (int) ($daily[$date] ?? 0)];
        })->values();

        return response()->json(['data' => [
            'days' => $days,
            'totals' => collect(self::STAT_EVENTS)->map(fn (AnalyticsEventName $e) => [
                'event' => $e->value,
                'total' => (int) ($totals[$e->value] ?? 0),
            ])->values(),
            'daily_views' => $series,
            'rating' => ['average' => round($business->rating_avg, 1), 'count' => $business->rating_count],
        ]]);
    }

    public function reviews(SimpleListRequest $request, Business $business): AnonymousResourceCollection
    {
        $this->ensureOwner($request, $business);

        return MyReviewResource::collection(
            $business->reviews()->published()->with('user:id,name')->latest()->orderByDesc('id')->paginate($request->perPage())
        );
    }

    public function reply(Request $request, Business $business, Review $review, ReviewService $reviews): MyReviewResource
    {
        $this->ensureOwner($request, $business);
        abort_unless($review->reviewable_type === 'business' && $review->reviewable_id === $business->id
            && $review->status === ReviewStatus::Published, 404);

        $body = $request->isMethod('DELETE') ? null
            : $request->validate(['body' => ['required', 'string', 'min:2', 'max:1500']])['body'];

        return new MyReviewResource($reviews->reply($review, $request->user(), $body)->load('user:id,name'));
    }

    /**
     * Only the owner linked by an approved claim or listing manages it. Anyone
     * else gets a 404 so listing ids can't be probed.
     */
    private function ensureOwner(Request $request, Business $business): void
    {
        abort_unless($business->owner_id !== null && $business->owner_id === $request->user()->id, 404);
    }
}
