<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AuditLogIndexRequest;
use App\Http\Resources\Admin\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

/**
 * Read-only: the audit trail has no update or delete endpoints.
 */
class AuditLogController extends Controller
{
    public function index(AuditLogIndexRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $tz = 'Asia/Kolkata';

        $logs = AuditLog::query()->with('actor:id,name,email')
            // "business." matches every business action; anything else is exact.
            ->when($filters['action'] ?? null, fn ($q, $action) => str_ends_with($action, '.')
                ? $q->whereRaw("action LIKE ? ESCAPE '!'", [str_replace('_', '!_', $action).'%'])
                : $q->where('action', $action))
            ->when($filters['actor_id'] ?? null, fn ($q, $id) => $q->where('actor_id', $id))
            ->when($filters['auditable_type'] ?? null, fn ($q, $type) => $q->where('auditable_type', $type))
            ->when($filters['auditable_id'] ?? null, fn ($q, $id) => $q->where('auditable_id', $id))
            ->when($filters['from'] ?? null, fn ($q, $d) => $q->where('created_at', '>=', Carbon::parse($d, $tz)->startOfDay()->utc()))
            ->when($filters['to'] ?? null, fn ($q, $d) => $q->where('created_at', '<=', Carbon::parse($d, $tz)->endOfDay()->utc()))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate($request->perPage())->withQueryString();

        return AuditLogResource::collection($logs);
    }
}
