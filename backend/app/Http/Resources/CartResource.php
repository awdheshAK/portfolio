<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $subtotal = $this->subtotalMinor();
        $discount = $this->discountMinor();

        return [
            'id' => $this->id,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'subtotal_minor' => $subtotal,
            'discount_minor' => $discount,
            'total_minor' => $this->totalMinor(),
            'coupon' => $this->whenLoaded('coupon', fn () => $this->coupon ? [
                'id' => $this->coupon->id,
                'code' => $this->coupon->code,
                'type' => $this->coupon->type,
                'value' => $this->coupon->value,
            ] : null),
            'currency' => 'INR',
        ];
    }
}
