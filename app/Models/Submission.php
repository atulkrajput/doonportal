<?php

namespace App\Models;

use App\Enums\SubmissionStatus;
use App\Enums\SubmissionType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Submission extends Model
{
    use HasUlids;

    protected $fillable = ['type', 'entity_type', 'entity_id', 'payload'];

    protected $attributes = [
        'status' => 'PENDING',
    ];

    protected function casts(): array
    {
        return [
            'type' => SubmissionType::class,
            'status' => SubmissionStatus::class,
            'payload' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }
}
