<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Color extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'hex',
        'price_delta_minor',
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
