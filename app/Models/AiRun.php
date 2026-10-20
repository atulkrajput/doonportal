<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One run of the daily discovery (scheduled at 1 AM IST, or started by staff).
 */
class AiRun extends Model
{
    use HasUlids;

    /** Requested from the admin; picked up by the scheduler within a minute. */
    public const QUEUED = 'queued';

    public const RUNNING = 'running';

    public const COMPLETED = 'completed';

    public const FAILED = 'failed';

    protected $fillable = ['trigger', 'status', 'category_slug', 'stats', 'found_count', 'ai_tokens', 'error', 'started_at', 'finished_at'];

    protected function casts(): array
    {
        return [
            'stats' => 'array',
            'found_count' => 'integer',
            'ai_tokens' => 'integer',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'requested_by');
    }

    public function discoveries(): HasMany
    {
        return $this->hasMany(AiDiscovery::class, 'run_id');
    }
}
