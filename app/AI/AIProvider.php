<?php

namespace App\AI;

/**
 * Vendor-neutral contract for LLM calls. Implementations return schema-free
 * JSON; callers must validate the result before using it.
 */
interface AIProvider
{
    /**
     * Run a chat completion that must answer with a single JSON object.
     *
     * @param  list<array{role: string, content: string}>  $messages
     * @param  array{model?: string, temperature?: float, max_tokens?: int}  $options
     *
     * @throws AIProviderException
     */
    public function chatJson(array $messages, array $options = []): AIResponse;

    public function name(): string;
}
