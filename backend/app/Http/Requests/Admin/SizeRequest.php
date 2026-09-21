<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SizeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'label' => [$sometimes, 'required', 'string', 'max:10'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('sizes', 'slug')->ignore($this->route('size'))],
            'price_delta_minor' => ['nullable', 'integer'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
