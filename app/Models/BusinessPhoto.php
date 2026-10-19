<?php

namespace App\Models;

use App\Enums\PhotoStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessPhoto extends Model
{
    use HasUlids;

    protected $fillable = ['business_id', 'media_id', 'caption', 'status', 'submitted_by', 'sort_order'];

    protected function casts(): array
    {
        return ['status' => PhotoStatus::class];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
