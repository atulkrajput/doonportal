<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlaceFacility extends Model
{
    use HasUlids;

    protected $fillable = ['place_id', 'name', 'notes'];

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class);
    }
}
