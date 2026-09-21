<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'color' => $this->whenLoaded('color', fn () => [
                'id' => $this->color->id,
                'name' => $this->color->name,
                'hex' => $this->color->hex,
            ]),
            'size' => $this->whenLoaded('size', fn () => [
                'id' => $this->size->id,
                'label' => $this->size->label,
            ]),
            'price_delta_minor' => $this->price_delta_minor,
            'price_minor' => $this->relationLoaded('product') ? $this->priceMinor() : null,
            'stock' => $this->stock,
            'is_active' => $this->is_active,
        ];
    }
}
