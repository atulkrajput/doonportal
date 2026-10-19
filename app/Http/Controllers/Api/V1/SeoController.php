<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Seo\SeoResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Head metadata for client-side navigation; same resolver as the server shell.
 */
class SeoController extends Controller
{
    public function __invoke(Request $request, SeoResolver $resolver): JsonResponse
    {
        $data = $request->validate(['path' => ['required', 'string', 'max:500', 'regex:#^/#']]);

        $parts = parse_url($data['path']) ?: [];
        parse_str($parts['query'] ?? '', $query);
        $path = strtolower(rtrim($parts['path'] ?? '/', '/')) ?: '/';

        return response()->json(['data' => $resolver->resolve($path, $query)->toArray()]);
    }
}
