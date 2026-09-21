<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'code' => [$sometimes, 'required', 'string', 'max:64', Rule::unique('coupons', 'code')->ignore($this->route('coupon'))],
            'type' => [$sometimes, 'required', 'string', 'in:percentage,fixed'],
            'value' => [$sometimes, 'required', 'integer', 'min:1'],
            'min_order_minor' => ['nullable', 'integer', 'min:0'],
            'max_discount_minor' => ['nullable', 'integer', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
