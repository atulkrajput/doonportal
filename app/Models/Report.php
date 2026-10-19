<?php

namespace App\Models;

use App\Enums\ReportReason;
use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Report extends Model
{
    use HasUlids;

    protected $fillable = ['reportable_type', 'reportable_id', 'reason', 'details'];

    protected $attributes = [
        'status' => 'OPEN',
    ];

    protected function casts(): array
    {
        return [
            'reason' => ReportReason::class,
            'status' => ReportStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolver_id');
    }

    public function reportable(): MorphTo
    {
        return $this->morphTo();
    }
}
