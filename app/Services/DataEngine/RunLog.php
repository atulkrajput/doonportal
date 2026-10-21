<?php

namespace App\Services\DataEngine;

use App\Models\AiRun;
use App\Models\AiRunLog;
use Illuminate\Support\Str;
use Throwable;

/**
 * Writes the step-by-step log of the current discovery run. Messages never
 * contain API keys or prompts: only what was called, the outcome, timing
 * and tokens. Logging never breaks a run.
 */
class RunLog
{
    private ?string $runId = null;

    private ?string $category = null;

    public function forRun(?AiRun $run): void
    {
        $this->runId = $run?->id;
        $this->category = null;
    }

    public function category(?string $slug): void
    {
        $this->category = $slug;
    }

    /**
     * @param  array{http_status?: ?int, duration_ms?: ?int, tokens?: ?int}  $extra
     */
    public function write(string $service, string $message, string $level = 'info', array $extra = []): void
    {
        try {
            AiRunLog::create([
                'run_id' => $this->runId,
                'service' => $service,
                'level' => $level,
                'category_slug' => $this->category,
                'message' => Str::limit($message, 495),
                ...array_intersect_key($extra, array_flip(['http_status', 'duration_ms', 'tokens'])),
            ]);
        } catch (Throwable) {
            // The log is a convenience; a write failure must not stop the run.
        }
    }

    /**
     * Time an external call and log its outcome.
     *
     * @template T
     *
     * @param  callable(): T  $call
     * @param  (callable(T): array{0: string, 1?: array<string, mixed>})|null  $describe  success message (+ extra) from the result
     * @return T
     */
    public function call(string $service, string $what, callable $call, ?callable $describe = null): mixed
    {
        $started = hrtime(true);
        try {
            $result = $call();
            [$message, $extra] = $describe ? $describe($result) + [1 => []] : ["{$what}: OK", []];
            $this->write($service, $message, 'info', $extra + ['duration_ms' => $this->ms($started)]);

            return $result;
        } catch (Throwable $e) {
            $this->write($service, "{$what}: ".$e->getMessage(), 'error', ['duration_ms' => $this->ms($started)]);
            throw $e;
        }
    }

    private function ms(int $started): int
    {
        return (int) round((hrtime(true) - $started) / 1_000_000);
    }
}
