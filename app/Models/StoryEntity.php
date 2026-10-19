<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StoryEntity extends Model
{
    use HasUlids;

    protected $fillable = ['story_id', 'entity_type', 'entity_id'];

    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }
}
