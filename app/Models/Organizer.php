<?php

namespace App\Models;

use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organizer extends Model
{
    use HasFactory, HasUlids, HasUniqueSlug, SoftDeletes;

    protected $fillable = ['name', 'slug', 'description', 'email', 'phone', 'website', 'user_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'organizer_business');
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
