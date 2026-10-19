<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ClaimStatus;
use App\Enums\PermissionName;
use App\Enums\ReportStatus;
use App\Enums\ReviewStatus;
use App\Enums\SubmissionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AuditLogResource;
use App\Models\Area;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\BusinessClaim;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Place;
use App\Models\Report;
use App\Models\Review;
use App\Models\Story;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Counts for the admin home. Each section is included only when the viewer
 * holds the permission that manages it.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $can = fn (PermissionName $p) => $user->can($p->value);
        $data = [];

        if ($can(PermissionName::ManageBusinesses)) {
            $data['businesses'] = [
                'total' => Business::count(),
                'published' => Business::where('is_published', true)->count(),
                'by_status' => $this->byStatus(Business::query()),
            ];
        }
        if ($can(PermissionName::ManagePlaces)) {
            $data['places'] = ['total' => Place::count(), 'by_status' => $this->byStatus(Place::query())];
        }
        if ($can(PermissionName::ManageEvents)) {
            $data['events'] = [
                'total' => Event::count(),
                'upcoming_public' => Event::query()->public()->upcomingOrLive()->count(),
                'by_status' => $this->byStatus(Event::query()),
            ];
        }
        if ($can(PermissionName::ManageStories)) {
            $data['stories'] = ['total' => Story::count(), 'by_status' => $this->byStatus(Story::query())];
        }
        if ($can(PermissionName::ManageCollections)) {
            $data['collections'] = ['total' => Collection::count(), 'by_status' => $this->byStatus(Collection::query())];
        }
        if ($can(PermissionName::ManageTaxonomy)) {
            $data['taxonomy'] = ['areas' => Area::count(), 'categories' => Category::count()];
        }
        if ($can(PermissionName::ManageUsers)) {
            $data['users'] = ['total' => User::count()];
        }

        $queues = array_filter([
            'reviews_pending' => $can(PermissionName::ModerateReviews) ? Review::where('status', ReviewStatus::Pending->value)->count() : null,
            'submissions_pending' => $can(PermissionName::ModerateSubmissions) ? Submission::where('status', SubmissionStatus::Pending->value)->count() : null,
            'claims_pending' => $can(PermissionName::ManageClaims) ? BusinessClaim::where('status', ClaimStatus::Pending->value)->count() : null,
            'reports_open' => $can(PermissionName::ManageReports) ? Report::where('status', ReportStatus::Open->value)->count() : null,
        ], fn ($v) => $v !== null);
        if ($queues !== []) {
            $data['moderation'] = $queues;
        }

        if ($can(PermissionName::ViewAuditLogs)) {
            $data['recent_activity'] = AuditLogResource::collection(
                AuditLog::with('actor:id,name,email')->latest('created_at')->orderByDesc('id')->limit(10)->get()
            )->resolve();
        }

        return response()->json(['data' => $data]);
    }

    /**
     * @return array<string, int>
     */
    private function byStatus(Builder $query): array
    {
        return $query->toBase()->selectRaw('status, COUNT(*) as aggregate')->groupBy('status')
            ->pluck('aggregate', 'status')->map(fn ($n) => (int) $n)->all();
    }
}
