<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filters shared by admin listings. Each controller applies the subset that
 * fits its entity; sort keys map to columns through an allowlist.
 */
class AdminIndexRequest extends FormRequest
{
    public const DEFAULT_PER_PAGE = 25;

    public const MAX_PER_PAGE = 100;

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
            'sort' => ['sometimes', 'string', Rule::in(['newest', 'oldest', 'updated', 'name', 'starts_at'])],
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'nullable', 'string', 'max:30'],
            'type' => ['sometimes', 'nullable', 'string', 'max:30'],
            'area_id' => ['sometimes', 'nullable', 'string', 'size:26'],
            'category_id' => ['sometimes', 'nullable', 'string', 'size:26'],
            'is_published' => ['sometimes', 'nullable', 'boolean'],
            'trashed' => ['sometimes', 'nullable', Rule::in(['with', 'only'])],
            'role' => ['sometimes', 'nullable', 'string', 'max:50'],
        ];
    }

    public function perPage(): int
    {
        return (int) $this->validated('per_page', self::DEFAULT_PER_PAGE);
    }

    public function filterValue(string $key): mixed
    {
        $value = $this->validated($key);

        return $value === '' ? null : $value;
    }
}
