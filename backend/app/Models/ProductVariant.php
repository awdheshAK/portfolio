<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'color_id',
        'size_id',
        'sku',
        'price_delta_minor',
        'stock',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_delta_minor' => 'integer',
            'stock' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(Color::class);
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }

    public function priceMinor(): int
    {
        return $this->product->base_price_minor + $this->price_delta_minor;
    }

    public function inStock(int $quantity = 1): bool
    {
        return $this->stock >= $quantity;
    }
}
