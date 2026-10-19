<?php

namespace App\Models;

use App\Enums\PhotoStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlacePhoto extends Model
{
    use HasUlids;

    protected $fillable = ['place_id', 'media_id', 'caption', 'status', 'submitted_by', 'sort_order'];

    protected function casts(): array
    {
        return ['status' => PhotoStatus::class];
    }

    public function place(): BelongsTo
    {
        return $this->belongsTo(Place::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
