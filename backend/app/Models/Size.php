<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Size extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'slug',
        'price_delta_minor',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_delta_minor' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
