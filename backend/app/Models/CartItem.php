<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    use HasFactory;

    public const TYPE_PRODUCT = 'product';

    public const TYPE_CUSTOM = 'custom';

    protected $fillable = [
        'cart_id',
        'type',
        'product_variant_id',
        'garment_id',
        'design_configuration',
        'name_snapshot',
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

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function garment(): BelongsTo
    {
        return $this->belongsTo(Garment::class);
    }
}
