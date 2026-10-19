<?php

namespace App\Http\Requests\Admin;

use App\Enums\EventStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EventStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(EventStatus::class)],
            // Cancelling always needs a reason; readers see it on the event page.
            'note' => ['nullable', 'string', 'max:255', 'required_if:status,'.EventStatus::Cancelled->value],
        ];
    }
}
