<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'is_disabled' => $this->deleted_at !== null,
            'created_at' => $this->created_at,
            'orders_count' => $this->when(isset($this->orders_count), $this->orders_count),
            'designs_count' => $this->when(isset($this->designs_count), $this->designs_count),
            'addresses_count' => $this->when(isset($this->addresses_count), $this->addresses_count),
            'measurements_count' => $this->when(isset($this->measurements_count), $this->measurements_count),
            'wishlists_count' => $this->when(isset($this->wishlists_count), $this->wishlists_count),
            'recent_orders' => OrderResource::collection($this->whenLoaded('orders')),
            'addresses' => AddressResource::collection($this->whenLoaded('addresses')),
            'measurements' => MeasurementResource::collection($this->whenLoaded('measurements')),
        ];
    }
}
