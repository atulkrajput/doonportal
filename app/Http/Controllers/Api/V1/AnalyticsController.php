<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EntityType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnalyticsEventRequest;
use App\Models\AnalyticsEvent;
use Illuminate\Http\Response;

class AnalyticsController extends Controller
{
    /**
     * Records an allowlisted interaction. No raw IP or user agent is stored: the
     * session hash is salted with the app key and rotates daily.
     */
    public function store(StoreAnalyticsEventRequest $request): Response
    {
        $data = $request->validated();

        if (isset($data['entity_type'])) {
            // Only public records: a different answer for hidden ones would reveal that they exist.
            $entity = EntityType::from($data['entity_type'])->modelClass()::query()->find($data['entity_id']);
            abort_unless($entity !== null && $entity->isPublic(), 422, 'Unknown entity.');
        }

        AnalyticsEvent::create([
            'name' => $data['name'],
            'entity_type' => $data['entity_type'] ?? null,
            'entity_id' => $data['entity_id'] ?? null,
            'user_id' => $this->viewer()?->id,
            'session_hash' => hash_hmac('sha256', $request->ip().'|'.$request->userAgent().'|'.now()->toDateString(), (string) config('app.key')),
            'properties' => $data['properties'] ?? null,
        ]);

        return response()->noContent(202);
    }
}
