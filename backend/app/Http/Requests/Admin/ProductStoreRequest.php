<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProductStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'base_price_minor' => ['required', 'integer', 'min:0'],
            'is_customizable' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'images' => ['nullable', 'array'],
            'images.*.url' => ['required_with:images', 'string', 'max:2048'],
            'images.*.alt_text' => ['nullable', 'string', 'max:255'],
            'variants' => ['nullable', 'array'],
            'variants.*.color_id' => ['nullable', 'integer', 'exists:colors,id'],
            'variants.*.size_id' => ['nullable', 'integer', 'exists:sizes,id'],
            'variants.*.sku' => ['required_with:variants', 'string', 'max:64', 'distinct'],
            'variants.*.price_delta_minor' => ['nullable', 'integer'],
            'variants.*.stock' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
