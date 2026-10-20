<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Approve / reject a claim or submission. A rejection must say why: the
 * member sees the note in their account.
 */
class ModerationDecisionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'notes' => [str_ends_with((string) $this->route()?->getName(), '.reject') ? 'required' : 'nullable', 'string', 'max:2000'],
        ];
    }
}
