<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintPosition extends Model
{
    use HasFactory;

    protected $table = 'customizer_print_positions';

    protected $fillable = ['label', 'slug', 'price_minor', 'x', 'y', 'anchor', 'is_active'];

    protected function casts(): array
    {
        return [
            'price_minor' => 'integer',
            'x' => 'decimal:2',
            'y' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
