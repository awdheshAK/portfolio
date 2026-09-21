<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmbroideryPosition extends Model
{
    use HasFactory;

    protected $table = 'customizer_embroidery_positions';

    protected $fillable = ['label', 'slug', 'price_minor', 'is_active'];

    protected function casts(): array
    {
        return [
            'price_minor' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
