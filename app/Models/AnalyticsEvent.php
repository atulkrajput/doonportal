<?php

namespace App\Models;

use App\Enums\AnalyticsEventName;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class AnalyticsEvent extends Model
{
    use HasUlids;

    public const UPDATED_AT = null;

    protected $fillable = ['name', 'entity_type', 'entity_id', 'user_id', 'session_hash', 'properties'];

    protected function casts(): array
    {
        return [
            'name' => AnalyticsEventName::class,
            'properties' => 'array',
        ];
    }
}
