<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'design_configuration' => $this->design_configuration,
        ];
    }
}
