<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'guest_token', 'coupon_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function subtotalMinor(): int
    {
        return $this->items->sum('total_price_minor');
    }

    public function discountMinor(): int
    {
        if (! $this->coupon) {
            return 0;
        }

        return $this->coupon->calculateDiscount($this->subtotalMinor());
    }

    public function totalMinor(): int
    {
        return max(0, $this->subtotalMinor() - $this->discountMinor());
    }
}
