<?php

namespace App\Http\Requests\Customizer;

use Illuminate\Foundation\Http\FormRequest;

class PriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'garment_id' => ['required', 'integer', 'exists:garments,id'],
            'fabric_id' => ['nullable', 'integer', 'exists:fabrics,id'],
            'color_id' => ['nullable', 'integer', 'exists:colors,id'],
            'size_id' => ['nullable', 'integer', 'exists:sizes,id'],
            'logo' => ['nullable', 'boolean'],
            'text' => ['nullable', 'array'],
            'print' => ['nullable', 'array'],
            'print.position_id' => ['required_with:print', 'integer', 'exists:customizer_print_positions,id'],
            'embroidery' => ['nullable', 'array'],
            'embroidery.position_id' => ['required_with:embroidery', 'integer', 'exists:customizer_embroidery_positions,id'],
            'patch_ids' => ['nullable', 'array'],
            'patch_ids.*' => ['integer', 'exists:customizer_patches,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
