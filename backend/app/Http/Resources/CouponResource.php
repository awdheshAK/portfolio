<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'value' => $this->value,
            'min_order_minor' => $this->min_order_minor,
            'max_discount_minor' => $this->max_discount_minor,
            'usage_limit' => $this->usage_limit,
            'used_count' => $this->used_count,
            'starts_at' => $this->starts_at,
            'expires_at' => $this->expires_at,
            'is_active' => $this->is_active,
        ];
    }
}
