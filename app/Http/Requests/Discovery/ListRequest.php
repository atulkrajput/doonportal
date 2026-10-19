<?php

namespace App\Http\Requests\Discovery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Shared pagination + sort validation for public listings. Sort values are
 * keys of an allowlist that DiscoveryQuery maps to ORDER BY clauses; raw
 * client input never reaches SQL ordering.
 */
abstract class ListRequest extends FormRequest
{
    public const DEFAULT_PER_PAGE = 20;

    public const MAX_PER_PAGE = 100;

    /**
     * @return list<string>
     */
    abstract public static function sorts(): array;

    /**
     * @return array<string, mixed>
     */
    protected function filterRules(): array
    {
        return [];
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
            'sort' => ['sometimes', 'string', Rule::in(static::sorts())],
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            ...$this->filterRules(),
        ];
    }

    public function perPage(): int
    {
        return (int) $this->validated('per_page', self::DEFAULT_PER_PAGE);
    }

    public function sort(): string
    {
        return $this->validated('sort') ?? static::sorts()[0];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return collect($this->validated())->except(['page', 'per_page', 'sort'])->all();
    }
}
