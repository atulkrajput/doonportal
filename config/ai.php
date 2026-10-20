<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI provider
    |--------------------------------------------------------------------------
    |
    | Provider used by the AI data engine and Doon AI. Supported: "groq",
    | "openai", "fake". Staff can switch provider, model and keys in
    | Admin > AI settings; these .env values are the fallback.
    | The public website never depends on the provider being available.
    |
    */

    'default' => env('AI_PROVIDER', 'groq'),

    'providers' => [
        'groq' => [
            'api_key' => env('GROQ_API_KEY'),
            'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
            'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
            'timeout' => (int) env('AI_TIMEOUT_SECONDS', 30),
        ],
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'timeout' => (int) env('AI_TIMEOUT_SECONDS', 30),
        ],
    ],

    // Web search for the daily discovery (https://tavily.com).
    'tavily_api_key' => env('TAVILY_API_KEY'),

    'budget' => [
        'daily_tokens' => (int) env('AI_DAILY_TOKEN_BUDGET', 500000),
        'monthly_tokens' => (int) env('AI_MONTHLY_TOKEN_BUDGET', 10000000),
    ],

];
