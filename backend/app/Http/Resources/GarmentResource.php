<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GarmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'base_price_minor' => $this->base_price_minor,
            'image_layers' => $this->image_layers,
            'available_sizes' => SizeResource::collection($this->availableSizes()),
            'available_colors' => ColorResource::collection($this->availableColors()),
        ];
    }
}
