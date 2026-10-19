<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\BusinessStatus;
use App\Http\Requests\Admin\AdminIndexRequest;
use App\Http\Requests\Admin\BusinessRequest;
use App\Http\Requests\Admin\BusinessStatusRequest;
use App\Http\Resources\Admin\AdminRecordResource;
use App\Models\Business;
use App\Services\StatusTransitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class BusinessController extends AdminController
{
    private const HOUR_FIELDS = ['day_of_week', 'opens_at', 'closes_at', 'is_closed'];

    private const SERVICE_FIELDS = ['name', 'description', 'price_min_paise', 'price_max_paise', 'sort_order'];

    private const SOCIAL_FIELDS = ['platform', 'url'];

    public function index(AdminIndexRequest $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', Rule::in(BusinessStatus::values())]]);

        $query = Business::query()->with('primaryArea:id,name,slug')
            ->when($request->filterValue('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->filterValue('area_id'), fn ($q, $id) => $q->where(fn ($q) => $q
                ->where('primary_area_id', $id)->orWhereHas('areas', fn ($q) => $q->whereKey($id))))
            ->when($request->filterValue('category_id'), fn ($q, $id) => $q->whereHas('categories', fn ($q) => $q->whereKey($id)))
            ->when($request->validated('is_published') !== null, fn ($q) => $q->where('is_published', $request->boolean('is_published')));

        return AdminRecordResource::collection(
            $this->paginate($query, $request, ['name', 'locality', 'address_line'], ['name' => 'name'])
        );
    }

    public function show(Business $business): AdminRecordResource
    {
        return new AdminRecordResource($this->loadDetail($business));
    }

    public function store(BusinessRequest $request): JsonResponse
    {
        $business = $this->saveAudited(new Business, $request->modelAttributes(), $this->relationSyncs($request));

        return (new AdminRecordResource($this->loadDetail($business)))->response()->setStatusCode(201);
    }

    public function update(BusinessRequest $request, Business $business): AdminRecordResource
    {
        $this->saveAudited($business, $request->modelAttributes(), $this->relationSyncs($request));

        return new AdminRecordResource($this->loadDetail($business));
    }

    public function destroy(Business $business): Response
    {
        $this->deleteAudited($business);

        return response()->noContent();
    }

    public function restore(Business $business): AdminRecordResource
    {
        $this->restoreAudited($business);

        return new AdminRecordResource($this->loadDetail($business));
    }

    public function status(BusinessStatusRequest $request, Business $business, StatusTransitionService $transitions): AdminRecordResource
    {
        $transitions->transitionBusiness($business, $request->enum('status', BusinessStatus::class), $request->user(), $request->validated('note'));

        return new AdminRecordResource($this->loadDetail($business));
    }

    private function loadDetail(Business $business): Business
    {
        return $business->load(['primaryArea:id,name,slug', 'categories:id,name,slug,type', 'areas:id,name,slug',
            'hours', 'services', 'socialLinks', 'logo', 'cover', 'owner:id,name']);
    }

    /**
     * @return array<string, callable>
     */
    private function relationSyncs(BusinessRequest $request): array
    {
        $data = $request->validated();
        $syncs = [];

        if (array_key_exists('category_ids', $data)) {
            $primary = $data['primary_category_id'] ?? ($data['category_ids'][0] ?? null);
            $ids = collect($data['category_ids'])->mapWithKeys(fn ($id) => [$id => ['is_primary' => $id === $primary]])->all();
            $syncs['category_ids'] = fn (Business $b) => $this->syncIds($b->categories(), $ids);
        }
        if (array_key_exists('area_ids', $data)) {
            $syncs['area_ids'] = fn (Business $b) => $this->syncIds($b->areas(), $data['area_ids']);
        }
        if (array_key_exists('hours', $data)) {
            $rows = collect($data['hours'])->map(fn ($h) => [
                'day_of_week' => $h['day_of_week'],
                'is_closed' => (bool) ($h['is_closed'] ?? false),
                'opens_at' => ($h['is_closed'] ?? false) ? null : $h['opens_at'],
                'closes_at' => ($h['is_closed'] ?? false) ? null : $h['closes_at'],
            ])->all();
            $syncs['hours'] = fn (Business $b) => $this->replaceChildren($b->hours(), $rows, self::HOUR_FIELDS);
        }
        if (array_key_exists('services', $data)) {
            $rows = collect($data['services'])->values()->map(fn ($s, $i) => [...$s, 'sort_order' => $i])->all();
            $syncs['services'] = fn (Business $b) => $this->replaceChildren($b->services(), $rows, self::SERVICE_FIELDS);
        }
        if (array_key_exists('social_links', $data)) {
            $syncs['social_links'] = fn (Business $b) => $this->replaceChildren($b->socialLinks(), $data['social_links'], self::SOCIAL_FIELDS);
        }

        return $syncs;
    }
}
