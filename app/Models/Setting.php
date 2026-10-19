<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/**
 * One row per settings group (seo, social, tracking). Read through App\Services\SiteSettings.
 */
class Setting extends Model
{
    use HasUlids;

    protected $fillable = ['group', 'value', 'updated_by'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }
}
