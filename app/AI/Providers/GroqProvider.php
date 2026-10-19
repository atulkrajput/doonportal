<?php

namespace App\AI\Providers;

use App\AI\AIProvider;
use App\AI\AIProviderException;
use App\AI\AIResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Groq exposes an OpenAI-compatible chat completions API.
 */
class GroqProvider implements AIProvider
{
    /**
     * @param  array{api_key: ?string, base_url: string, model: string, timeout: int}  $config
     */
    public function __construct(private readonly array $config) {}

    public function name(): string
    {
        return 'groq';
    }

    public function chatJson(array $messages, array $options = []): AIResponse
    {
        if (blank($this->config['api_key'] ?? null)) {
            throw new AIProviderException('Groq API key is not configured (GROQ_API_KEY).');
        }

        $model = $options['model'] ?? $this->config['model'];

        try {
            $response = Http::baseUrl($this->config['base_url'])
                ->withToken($this->config['api_key'])
                ->acceptJson()
                ->timeout($this->config['timeout'])
                ->retry(2, 500, throw: false)
                ->post('/chat/completions', array_filter([
                    'model' => $model,
                    'messages' => $messages,
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => $options['temperature'] ?? 0,
                    'max_tokens' => $options['max_tokens'] ?? null,
                ], fn ($v) => $v !== null));
        } catch (ConnectionException $e) {
            throw new AIProviderException('Groq request failed: '.$e->getMessage(), previous: $e);
        }

        if ($response->failed()) {
            // Never include request headers/body in the message: they carry the key and prompts.
            throw new AIProviderException("Groq request failed with HTTP {$response->status()}.");
        }

        $content = $response->json('choices.0.message.content');
        $data = is_string($content) ? json_decode($content, true) : null;

        if (! is_array($data)) {
            throw new AIProviderException('Groq returned a response that is not a JSON object.');
        }

        return new AIResponse(
            data: $data,
            provider: $this->name(),
            model: (string) ($response->json('model') ?? $model),
            promptTokens: (int) $response->json('usage.prompt_tokens', 0),
            completionTokens: (int) $response->json('usage.completion_tokens', 0),
        );
    }
}
