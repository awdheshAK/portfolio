<?php

namespace App\Http\Requests\Designs;

use Illuminate\Foundation\Http\FormRequest;

class DesignUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'configuration' => ['sometimes', 'required', 'array'],
            'configuration.garment_id' => ['required_with:configuration', 'integer', 'exists:garments,id'],
            'preview_image_url' => ['nullable', 'string', 'url', 'max:2048'],
        ];
    }
}
