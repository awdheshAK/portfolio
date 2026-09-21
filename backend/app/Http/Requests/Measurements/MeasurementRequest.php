<?php

namespace App\Http\Requests\Measurements;

use Illuminate\Foundation\Http\FormRequest;

class MeasurementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'label' => [$sometimes, 'required', 'string', 'max:64'],
            'height' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'chest' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'waist' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'hip' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'shoulder' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'sleeve_length' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'neck' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'inseam' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'outseam' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'garment_length' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
        ];
    }
}
