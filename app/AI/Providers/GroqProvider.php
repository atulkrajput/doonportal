<?php

namespace App\AI\Providers;

/**
 * Groq exposes an OpenAI-compatible chat completions API.
 */
class GroqProvider extends OpenAiCompatibleProvider
{
    /**
     * @param  array{api_key: ?string, base_url: string, model: string, timeout: int}  $config
     */
    public function __construct(array $config)
    {
        parent::__construct($config, 'groq', 'Groq');
    }
}
