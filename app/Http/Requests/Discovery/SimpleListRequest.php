<?php

namespace App\Http\Requests\Discovery;

/**
 * Pagination-only listing (collections, reviews, photos).
 */
class SimpleListRequest extends ListRequest
{
    public static function sorts(): array
    {
        return ['newest'];
    }
}
