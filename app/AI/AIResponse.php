<?php

namespace App\AI;

final class AIResponse
{
    /**
     * @param  array<string, mixed>  $data  Decoded JSON object returned by the model (untrusted).
     */
    public function __construct(
        public readonly array $data,
        public readonly string $provider,
        public readonly string $model,
        public readonly int $promptTokens = 0,
        public readonly int $completionTokens = 0,
    ) {}

    public function totalTokens(): int
    {
        return $this->promptTokens + $this->completionTokens;
    }
}
