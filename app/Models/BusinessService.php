<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessService extends Model
{
    use HasUlids;

    protected $fillable = ['business_id', 'name', 'description', 'price_min_paise', 'price_max_paise', 'sort_order'];

    protected function casts(): array
    {
        return ['price_min_paise' => 'integer', 'price_max_paise' => 'integer'];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
