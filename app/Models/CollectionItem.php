<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CollectionItem extends Model
{
    use HasUlids;

    protected $fillable = ['collection_id', 'item_type', 'item_id', 'position', 'note'];

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function item(): MorphTo
    {
        return $this->morphTo();
    }
}
