<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->name_snapshot,
            'quantity' => $this->quantity,
            'unit_price_minor' => $this->unit_price_minor,
            'total_price_minor' => $this->total_price_minor,
            'product_variant' => $this->whenLoaded('productVariant', fn () => $this->productVariant ? new ProductVariantResource($this->productVariant) : null),
            'garment_id' => $this->garment_id,
            'design_configuration' => $this->design_configuration,
        ];
    }
}
