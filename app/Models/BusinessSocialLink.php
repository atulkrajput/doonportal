<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessSocialLink extends Model
{
    use HasUlids;

    protected $fillable = ['business_id', 'platform', 'url'];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
