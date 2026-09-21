<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PrintPositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'label' => [$sometimes, 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('customizer_print_positions', 'slug')->ignore($this->route('print_position'))],
            'price_minor' => [$sometimes, 'required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
