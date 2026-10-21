<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One step or external call of a discovery run (see RunLog).
 */
class AiRunLog extends Model
{
    use HasUlids;

    public const UPDATED_AT = null;

    protected $fillable = ['run_id', 'service', 'level', 'category_slug', 'message', 'http_status', 'duration_ms', 'tokens'];

    protected function casts(): array
    {
        return [
            'http_status' => 'integer',
            'duration_ms' => 'integer',
            'tokens' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(AiRun::class, 'run_id');
    }
}
