<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default AI provider
    |--------------------------------------------------------------------------
    |
    | Provider used by the AI data engine and Doon AI. Supported: "groq", "fake".
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
    ],

    'budget' => [
        'daily_tokens' => (int) env('AI_DAILY_TOKEN_BUDGET', 500000),
        'monthly_tokens' => (int) env('AI_MONTHLY_TOKEN_BUDGET', 10000000),
    ],

];
