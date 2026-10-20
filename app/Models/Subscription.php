<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A business's plan subscription, recorded by staff. amount_paise + paid_at
 * describe a payment actually received; revenue reports count only those.
 */
class Subscription extends Model
{
    use HasUlids;

    protected $fillable = [
        'business_id', 'plan_id', 'status', 'starts_on', 'ends_on', 'amount_paise', 'currency',
        'payment_method', 'payment_reference', 'paid_at', 'notes',
    ];

    protected $attributes = [
        'status' => 'PENDING',
        'currency' => 'INR',
    ];

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'payment_method' => PaymentMethod::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
            'amount_paise' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }
}
