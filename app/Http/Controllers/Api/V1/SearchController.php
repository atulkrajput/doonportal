<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Search\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request, SearchService $search): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
            'types' => ['sometimes', 'string', 'max:50'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ]);

        $types = isset($validated['types'])
            ? array_values(array_intersect(SearchService::TYPES, explode(',', $validated['types'])))
            : SearchService::TYPES;

        $results = $search->search($validated['q'], $types, (int) ($validated['limit'] ?? 5));

        return response()->json([
            'query' => $validated['q'],
            'results' => $results,
            'total' => array_sum(array_map('count', $results)),
        ]);
    }
}
