<?php

namespace App\Models;

use App\Models\Concerns\NormalizesTimes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessHourException extends Model
{
    use HasUlids, NormalizesTimes;

    protected $fillable = ['business_id', 'date', 'opens_at', 'closes_at', 'is_closed', 'note'];

    protected function casts(): array
    {
        return ['date' => 'date', 'is_closed' => 'boolean'];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
