<?php

namespace App\Http\Requests\Addresses;

use Illuminate\Foundation\Http\FormRequest;

class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'label' => ['nullable', 'string', 'max:64'],
            'full_name' => [$sometimes, 'required', 'string', 'max:255'],
            'phone' => [$sometimes, 'required', 'string', 'max:32'],
            'line1' => [$sometimes, 'required', 'string', 'max:255'],
            'line2' => ['nullable', 'string', 'max:255'],
            'city' => [$sometimes, 'required', 'string', 'max:128'],
            'state' => [$sometimes, 'required', 'string', 'max:128'],
            'postal_code' => [$sometimes, 'required', 'string', 'max:16'],
            'country' => ['nullable', 'string', 'size:2'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
