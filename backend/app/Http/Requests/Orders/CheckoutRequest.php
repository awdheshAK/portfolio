<?php

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shipping_address_id' => ['required_without:shipping_address', 'integer', 'exists:addresses,id'],
            'shipping_address' => ['required_without:shipping_address_id', 'array'],
            'shipping_address.full_name' => ['required_with:shipping_address', 'string', 'max:255'],
            'shipping_address.phone' => ['required_with:shipping_address', 'string', 'max:32'],
            'shipping_address.line1' => ['required_with:shipping_address', 'string', 'max:255'],
            'shipping_address.line2' => ['nullable', 'string', 'max:255'],
            'shipping_address.city' => ['required_with:shipping_address', 'string', 'max:128'],
            'shipping_address.state' => ['required_with:shipping_address', 'string', 'max:128'],
            'shipping_address.postal_code' => ['required_with:shipping_address', 'string', 'max:16'],
            'shipping_address.country' => ['nullable', 'string', 'size:2'],
            'billing_same_as_shipping' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
