<?php

namespace App\Models;

use App\Enums\ClaimStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessClaim extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'user_id', 'claimant_role', 'contact_phone', 'contact_email', 'evidence',
    ];

    protected $attributes = [
        'status' => 'PENDING',
    ];

    protected function casts(): array
    {
        return [
            'status' => ClaimStatus::class,
            'evidence' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
