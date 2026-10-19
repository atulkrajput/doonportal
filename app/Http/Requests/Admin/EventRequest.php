<?php

namespace App\Http\Requests\Admin;

use App\Enums\CategoryType;
use App\Enums\EventStatus;
use App\Models\Event;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Date-times without an explicit offset (e.g. "2026-11-01T18:00" from a
 * datetime-local input) are read as wall-clock time in the event's time zone
 * and stored in UTC.
 */
class EventRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return [
            'title', 'slug', 'summary', 'description', 'is_featured',
            'starts_at', 'ends_at', 'timezone', 'is_all_day',
            'venue_id', 'area_id', 'organizer_id', 'online_url',
            'is_free', 'price_min_paise', 'price_max_paise', 'currency', 'ticket_url', 'age_restriction',
            'contact_phone', 'contact_email', 'cover_media_id', 'source_name', 'source_url',
        ];
    }

    public function rules(): array
    {
        return [
            'title' => [$this->requiredOnCreate(), 'string', 'max:255'],
            ...$this->slugRules('events', 'event'),
            'summary' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'is_featured' => ['sometimes', 'boolean'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'timezone' => ['sometimes', 'string', 'timezone:all'],
            'is_all_day' => ['sometimes', 'boolean'],
            'venue_id' => ['sometimes', 'nullable', 'string', Rule::exists('venues', 'id')->whereNull('deleted_at')],
            'area_id' => ['sometimes', 'nullable', 'string', $this->existingArea()],
            'organizer_id' => ['sometimes', 'nullable', 'string', Rule::exists('organizers', 'id')->whereNull('deleted_at')],
            'online_url' => ['sometimes', 'nullable', 'url:https,http', 'max:2048'],
            'is_free' => ['sometimes', 'boolean'],
            'price_min_paise' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000000'],
            'price_max_paise' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000000'],
            'currency' => ['sometimes', 'string', Rule::in(['INR'])],
            'ticket_url' => ['sometimes', 'nullable', 'url:https,http', 'max:2048'],
            'age_restriction' => ['sometimes', 'nullable', 'string', 'max:30'],
            'contact_phone' => ['sometimes', 'nullable', 'string', self::PHONE_REGEX],
            'contact_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'cover_media_id' => ['sometimes', 'nullable', 'string', $this->mediaRule()],
            ...$this->sourceRules(),

            'category_ids' => ['sometimes', 'array', 'max:10'],
            'category_ids.*' => ['string', 'distinct', $this->categoryOfType(CategoryType::Event)],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            /** @var Event|null $event */
            $event = $this->routeModel('event');
            $data = $this->modelAttributes();

            $starts = array_key_exists('starts_at', $data) ? $data['starts_at'] : $event?->starts_at;
            $ends = array_key_exists('ends_at', $data) ? $data['ends_at'] : $event?->ends_at;
            if ($starts !== null && $ends !== null && $ends->lt($starts)) {
                $validator->errors()->add('ends_at', 'The event cannot end before it starts.');
            }

            // Announced events change dates only through the reschedule endpoint,
            // which records the original start for readers.
            if ($event && in_array($event->status->value, EventStatus::publicValues(), true)) {
                foreach (['starts_at', 'ends_at'] as $key) {
                    if (array_key_exists($key, $data) && $data[$key]?->toIso8601String() !== $event->{$key}?->toIso8601String()) {
                        $validator->errors()->add($key, 'Use the reschedule action to change the dates of a published or cancelled event.');
                    }
                }
            }

            $min = $data['price_min_paise'] ?? $event?->price_min_paise;
            $max = $data['price_max_paise'] ?? $event?->price_max_paise;
            if ($min !== null && $max !== null && $max < $min) {
                $validator->errors()->add('price_max_paise', 'The maximum price must be at least the minimum price.');
            }
        }];
    }

    public function modelAttributes(): array
    {
        $attributes = parent::modelAttributes();
        $timezone = $attributes['timezone'] ?? $this->routeModel('event')?->timezone ?? 'Asia/Kolkata';

        foreach (['starts_at', 'ends_at'] as $key) {
            if (array_key_exists($key, $attributes)) {
                $attributes[$key] = self::toUtc($attributes[$key], $timezone);
            }
        }

        return $attributes;
    }

    public static function toUtc(?string $value, string $timezone): ?Carbon
    {
        return blank($value) ? null : Carbon::parse($value, $timezone)->utc();
    }
}
