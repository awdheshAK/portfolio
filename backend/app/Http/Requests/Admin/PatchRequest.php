<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'name' => [$sometimes, 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('customizer_patches', 'slug')->ignore($this->route('patch'))],
            'type' => ['nullable', 'string', 'max:32'],
            'price_minor' => [$sometimes, 'required', 'integer', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
