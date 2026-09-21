<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CollectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'is_active' => $this->is_active,
            'deleted_at' => $this->deleted_at,
            'products' => ProductResource::collection($this->whenLoaded('products')),
            'product_ids' => $this->whenLoaded('products', fn () => $this->products->pluck('id')),
        ];
    }
}
