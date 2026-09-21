<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SizeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'slug' => $this->slug,
            'price_delta_minor' => $this->price_delta_minor,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
