<?php

namespace App\Http\Requests\Admin;

use App\Enums\PaymentMethod;
use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A subscription recorded by staff. A payment counts towards revenue only when
 * both amount and paid date are given; there is no payment gateway yet.
 */
class SubscriptionRequest extends AdminWriteRequest
{
    public function attributeKeys(): array
    {
        return ['business_id', 'plan_id', 'status', 'starts_on', 'ends_on', 'amount_paise', 'payment_method', 'payment_reference', 'paid_at', 'notes'];
    }

    public function rules(): array
    {
        return [
            'business_id' => [$this->requiredOnCreate(), 'string', Rule::exists('businesses', 'id')->whereNull('deleted_at')],
            'plan_id' => [$this->requiredOnCreate(), 'string', Rule::exists('plans', 'id')->whereNull('deleted_at')],
            'status' => ['sometimes', Rule::in(SubscriptionStatus::values())],
            'starts_on' => [$this->requiredOnCreate(), 'date_format:Y-m-d'],
            'ends_on' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'amount_paise' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            'payment_method' => ['sometimes', 'nullable', Rule::in(PaymentMethod::values())],
            'payment_reference' => ['sometimes', 'nullable', 'string', 'max:120'],
            'paid_at' => ['sometimes', 'nullable', 'date', 'before_or_equal:now'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            /** @var Subscription|null $current */
            $current = $this->routeModel('subscription');
            $starts = $this->input('starts_on', $current?->starts_on?->toDateString());
            $ends = $this->has('ends_on') ? $this->input('ends_on') : $current?->ends_on?->toDateString();
            if ($starts && $ends && $ends < $starts) {
                $validator->errors()->add('ends_on', 'The end date must be on or after the start date.');
            }
            $paidAt = $this->has('paid_at') ? $this->input('paid_at') : $current?->paid_at;
            $method = $this->has('payment_method') ? $this->input('payment_method') : $current?->payment_method?->value;
            if ($paidAt && ! $method) {
                $validator->errors()->add('payment_method', 'Record how the payment was received.');
            }
        }];
    }

    public function modelAttributes(): array
    {
        $attributes = parent::modelAttributes();
        if (array_key_exists('paid_at', $attributes) && $attributes['paid_at'] !== null) {
            $attributes['paid_at'] = Carbon::parse($attributes['paid_at'], 'Asia/Kolkata')->utc();
        }

        return $attributes;
    }
}
