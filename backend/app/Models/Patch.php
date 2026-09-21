<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patch extends Model
{
    use HasFactory;

    protected $table = 'customizer_patches';

    protected $fillable = ['name', 'slug', 'type', 'price_minor', 'image_url', 'is_active'];

    protected function casts(): array
    {
        return [
            'price_minor' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
