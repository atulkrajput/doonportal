<?php

namespace App\Models;

use App\Enums\PlanInterval;
use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A listing plan businesses can subscribe to (e.g. Featured listing).
 */
class Plan extends Model
{
    use HasUlids, HasUniqueSlug, SoftDeletes;

    protected $fillable = ['name', 'slug', 'description', 'price_paise', 'currency', 'interval', 'features', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return [
            'interval' => PlanInterval::class,
            'price_paise' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
