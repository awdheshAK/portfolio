<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmbroideryPositionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'slug' => $this->slug,
            'price_minor' => $this->price_minor,
            'x' => $this->x !== null ? (float) $this->x : null,
            'y' => $this->y !== null ? (float) $this->y : null,
            'anchor' => $this->anchor,
            'is_active' => $this->is_active,
        ];
    }
}
