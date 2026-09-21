<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeasurementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'height' => $this->height !== null ? (float) $this->height : null,
            'chest' => $this->chest !== null ? (float) $this->chest : null,
            'waist' => $this->waist !== null ? (float) $this->waist : null,
            'hip' => $this->hip !== null ? (float) $this->hip : null,
            'shoulder' => $this->shoulder !== null ? (float) $this->shoulder : null,
            'sleeve_length' => $this->sleeve_length !== null ? (float) $this->sleeve_length : null,
            'neck' => $this->neck !== null ? (float) $this->neck : null,
            'inseam' => $this->inseam !== null ? (float) $this->inseam : null,
            'outseam' => $this->outseam !== null ? (float) $this->outseam : null,
            'garment_length' => $this->garment_length !== null ? (float) $this->garment_length : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
