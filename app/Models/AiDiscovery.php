<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A business found by the discovery run, waiting for staff review. Its data
 * is untrusted until a staff member approves it; approval creates an
 * Unverified listing credited to the source.
 */
class AiDiscovery extends Model
{
    use HasUlids;

    public const PENDING = 'PENDING';

    public const APPROVED = 'APPROVED';

    public const REJECTED = 'REJECTED';

    public const DUPLICATE = 'DUPLICATE';

    public const STATUSES = [self::PENDING, self::APPROVED, self::REJECTED, self::DUPLICATE];

    protected $fillable = ['source', 'external_id', 'category_id', 'name', 'data', 'evidence', 'ai', 'duplicate_of_id'];

    protected $attributes = ['status' => self::PENDING];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'evidence' => 'array',
            'ai' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(AiRun::class, 'run_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function duplicateOf(): BelongsTo
    {
        return $this->belongsTo(Business::class, 'duplicate_of_id');
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'reviewer_id');
    }
}
