<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fabric extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
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
