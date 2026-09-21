<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'type',
        'product_variant_id',
        'product_id',
        'name_snapshot',
        'design_configuration',
        'quantity',
        'unit_price_minor',
        'total_price_minor',
    ];

    protected function casts(): array
    {
        return [
            'design_configuration' => 'array',
            'quantity' => 'integer',
            'unit_price_minor' => 'integer',
            'total_price_minor' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
