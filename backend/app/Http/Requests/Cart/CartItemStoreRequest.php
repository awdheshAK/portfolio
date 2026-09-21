<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class CartItemStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:product,custom'],
            'product_variant_id' => ['required_if:type,product', 'integer', 'exists:product_variants,id'],
            'design_configuration' => ['required_if:type,custom', 'array'],
            'design_configuration.garment_id' => ['required_if:type,custom', 'integer', 'exists:garments,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
