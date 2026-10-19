<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\EventStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\EventRequest;
use App\Http\Requests\Admin\EventStatusRequest;
use App\Http\Requests\Admin\RescheduleEventRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Event;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class EventController extends AdminController
{
    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(EventStatus::values())]]);

        $query = Event::query()->with(['venue:id,name', 'area:id,name,slug'])
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->filterValue('area_id'), fn ($q, $id) => $q->where('area_id', $id))
            ->when($request->filterValue('category_id'), fn ($q, $id) => $q->whereHas('categories', fn ($q) => $q->whereKey($id)));

        return AdminRecordResource::collection(
            $this->paginate($query, $request, ['title', 'summary'], ['name' => 'title', 'starts_at' => '-starts_at'])
        );
    }

    public function show(Event $event): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($event));
    }

    public function store(EventRequest $request): JsonResponse
    {
        $event = new Event;
        $event->submitted_by = $request->user()->id;
        $event = $this->saveAudited($event, $request->modelAttributes(), $this->relationSyncs($request));

        return (new AdminRecordResource($this->loadDetail($event)))->response()->setStatusCode(201);
    }

    public function update(EventRequest $request, Event $event): AdminRecordResource
    {
        $this->saveAudited($event, $request->modelAttributes(), $this->relationSyncs($request));

        return new AdminRecordResource($this->loadDetail($event));
    }

    public function destroy(Event $event): Response
    {
        $this->deleteAudited($event);

        return response()->noContent();
    }

    public function restore(Event $event): AdminRecordResource
    {
        $this->restoreAudited($event);

        return new AdminRecordResource($this->loadDetail($event));
    }

    /**
     * Publish, send to review, cancel (with a reason), archive…
     */
    public function status(EventStatusRequest $request, Event $event, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->transitionEvent($event, $request->enum('status', EventStatus::class), $request->user(), $request->validated('note'));

        return new AdminRecordResource($this->loadDetail($event));
    }

    public function reschedule(RescheduleEventRequest $request, Event $event, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->rescheduleEvent(
            $event,
            EventRequest::toUtc($request->validated('starts_at'), $event->timezone),
            EventRequest::toUtc($request->validated('ends_at'), $event->timezone),
            $request->user(),
            $request->validated('reason'),
        );

        return new AdminRecordResource($this->loadDetail($event));
    }

    private function loadDetail(Event $event): Event
    {
        return $event->load(['venue:id,name,slug', 'area:id,name,slug', 'organizer:id,name,slug', 'categories:id,name,slug,type', 'cover', 'submitter:id,name']);
    }

    /**
     * @return array<string, callable>
     */
    private function relationSyncs(EventRequest $request): array
    {
        $data = $request->validated();

        return array_key_exists('category_ids', $data)
            ? ['category_ids' => fn (Event $e) => $this->syncIds($e->categories(), $data['category_ids'])]
            : [];
    }
}
