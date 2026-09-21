<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Measurement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'label',
        'height',
        'chest',
        'waist',
        'hip',
        'shoulder',
        'sleeve_length',
        'neck',
        'inseam',
        'outseam',
        'garment_length',
    ];

    protected function casts(): array
    {
        return [
            'height' => 'decimal:2',
            'chest' => 'decimal:2',
            'waist' => 'decimal:2',
            'hip' => 'decimal:2',
            'shoulder' => 'decimal:2',
            'sleeve_length' => 'decimal:2',
            'neck' => 'decimal:2',
            'inseam' => 'decimal:2',
            'outseam' => 'decimal:2',
            'garment_length' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
