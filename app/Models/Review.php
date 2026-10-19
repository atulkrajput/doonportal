<?php

namespace App\Models;

use App\Enums\ReviewStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Review extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = ['rating', 'title', 'body', 'visited_on'];

    protected $attributes = [
        'status' => 'PENDING',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReviewStatus::class,
            'rating' => 'integer',
            'visited_on' => 'date',
            'helpful_count' => 'integer',
            'moderated_at' => 'datetime',
        ];
    }

    public function scopePublished(Builder $query): void
    {
        $query->where('status', ReviewStatus::Published->value);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewable(): MorphTo
    {
        return $this->morphTo();
    }

    public function voters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'review_votes')->withPivot('is_helpful')->withTimestamps();
    }
}
