<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\AI\AIProvider;
use App\AI\AIProviderException;
use App\Services\AI\AiSettings;
use App\Services\DataEngine\TavilyClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

/**
 * Admin > AI settings (ai.manage). Keys are write-only: responses show only
 * whether each key is set and its last four characters.
 */
class AiSettingsController extends AdminController
{
    public function show(AiSettings $settings): JsonResponse
    {
        return response()->json(['data' => $settings->forAdmin() + ['meta' => $this->meta()]]);
    }

    public function update(Request $request, AiSettings $settings): JsonResponse
    {
        $settings->update($request->validate(AiSettings::rules()), $request->user());

        return $this->show($settings);
    }

    /**
     * Check the saved AI key (and web search key) with a tiny request.
     */
    public function test(AiSettings $settings, TavilyClient $search): JsonResponse
    {
        $result = ['ai' => null, 'web_search' => null];

        try {
            $response = app(AIProvider::class)->chatJson([
                ['role' => 'system', 'content' => 'Reply with JSON only.'],
                ['role' => 'user', 'content' => 'Reply with {"ok": true}.'],
            ], ['max_tokens' => 20]);
            $result['ai'] = ['ok' => ($response->data['ok'] ?? false) === true, 'message' => "{$response->provider} ({$response->model}) answered."];
        } catch (AIProviderException $e) {
            $result['ai'] = ['ok' => false, 'message' => $e->getMessage()];
        }

        if (filled($settings->get('tavily_api_key'))) {
            try {
                $count = count($search->search((string) $settings->get('tavily_api_key'), 'cafes in Dehradun', 1));
                $result['web_search'] = ['ok' => true, 'message' => "Web search answered ({$count} result)."];
            } catch (Throwable $e) {
                $result['web_search'] = ['ok' => false, 'message' => $e->getMessage()];
            }
        }

        return response()->json(['data' => $result]);
    }

    /**
     * @return array<string, mixed>
     */
    private function meta(): array
    {
        return [
            'max_per_category' => config('discovery.max_per_category'),
            'categories' => count(config('discovery.categories')),
            'daily_token_budget' => (int) config('ai.budget.daily_tokens'),
            'run_time' => '01:00 IST',
        ];
    }
}
