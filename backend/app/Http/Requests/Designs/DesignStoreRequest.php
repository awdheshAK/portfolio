<?php

namespace App\Http\Requests\Designs;

use Illuminate\Foundation\Http\FormRequest;

class DesignStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'configuration' => ['required', 'array'],
            'configuration.garment_id' => ['required', 'integer', 'exists:garments,id'],
            'preview_image_url' => ['nullable', 'string', 'url', 'max:2048'],
        ];
    }
}
