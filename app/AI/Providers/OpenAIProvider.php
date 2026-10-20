<?php

namespace App\AI\Providers;

class OpenAIProvider extends OpenAiCompatibleProvider
{
    /**
     * @param  array{api_key: ?string, base_url: string, model: string, timeout: int}  $config
     */
    public function __construct(array $config)
    {
        parent::__construct($config, 'openai', 'OpenAI');
    }
}
