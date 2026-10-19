<?php

namespace App\AI\Providers;

use App\AI\AIProvider;
use App\AI\AIProviderException;
use App\AI\AIResponse;

/**
 * Deterministic provider for tests and local development without an API key.
 */
class FakeProvider implements AIProvider
{
    /** @var list<array<string, mixed>|\Throwable> */
    private array $queue = [];

    /** @var list<list<array{role: string, content: string}>> */
    public array $calls = [];

    /**
     * @param  array<string, mixed>|\Throwable  $response
     */
    public function push(array|\Throwable $response): static
    {
        $this->queue[] = $response;

        return $this;
    }

    public function name(): string
    {
        return 'fake';
    }

    public function chatJson(array $messages, array $options = []): AIResponse
    {
        $this->calls[] = $messages;
        $next = array_shift($this->queue) ?? [];

        if ($next instanceof \Throwable) {
            throw $next instanceof AIProviderException ? $next : new AIProviderException($next->getMessage(), previous: $next);
        }

        return new AIResponse($next, $this->name(), $options['model'] ?? 'fake-model');
    }
}
