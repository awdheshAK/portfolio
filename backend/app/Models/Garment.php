<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Garment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'base_price_minor',
        'image_layers',
        'available_size_ids',
        'available_color_ids',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'base_price_minor' => 'integer',
            'image_layers' => 'array',
            'available_size_ids' => 'array',
            'available_color_ids' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function availableSizes()
    {
        return Size::whereIn('id', $this->available_size_ids ?? [])->get();
    }

    public function availableColors()
    {
        return Color::whereIn('id', $this->available_color_ids ?? [])->get();
    }
}
