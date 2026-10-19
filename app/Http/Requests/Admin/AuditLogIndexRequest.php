<?php

namespace App\Http\Requests\Admin;

use App\Enums\EntityType;
use Illuminate\Validation\Rule;

class AuditLogIndexRequest extends AdminIndexRequest
{
    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
            'action' => ['sometimes', 'nullable', 'string', 'max:100', 'regex:/^[a-z_.]+$/'],
            'actor_id' => ['sometimes', 'nullable', 'string', 'size:26'],
            'auditable_type' => ['sometimes', 'nullable', Rule::in(array_column(EntityType::cases(), 'value'))],
            'auditable_id' => ['sometimes', 'nullable', 'string', 'size:26'],
            'from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }
}
