<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\BusinessSubmissionRequest;
use App\Http\Requests\Discovery\SimpleListRequest;
use App\Http\Resources\Account\SubmissionResource;
use App\Models\Submission;
use App\Services\Community\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * The member's own submissions: new listings and proposed listing edits.
 */
class SubmissionController extends Controller
{
    public function __construct(private readonly SubmissionService $submissions) {}

    public function index(SimpleListRequest $request): AnonymousResourceCollection
    {
        return SubmissionResource::collection(
            $request->user()->submissions()->with('entity')->latest()->orderByDesc('id')->paginate($request->perPage())
        );
    }

    public function storeBusiness(BusinessSubmissionRequest $request): JsonResponse
    {
        $submission = $this->submissions->submitBusiness($request->user(), $request->listing());

        return (new SubmissionResource($submission))->response()->setStatusCode(201);
    }

    public function destroy(Request $request, Submission $submission): Response
    {
        abort_unless($submission->user_id === $request->user()->id, 404);

        $this->submissions->withdraw($submission, $request->user());

        return response()->noContent();
    }
}
