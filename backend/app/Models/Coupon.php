<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coupon extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPE_PERCENTAGE = 'percentage';

    public const TYPE_FIXED = 'fixed';

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_minor',
        'max_discount_minor',
        'usage_limit',
        'used_count',
        'starts_at',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'min_order_minor' => 'integer',
            'max_discount_minor' => 'integer',
            'usage_limit' => 'integer',
            'used_count' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function isValidFor(int $subtotalMinor): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }

        if ($this->expires_at && $now->gt($this->expires_at)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        if ($subtotalMinor < $this->min_order_minor) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(int $subtotalMinor): int
    {
        if ($this->type === self::TYPE_PERCENTAGE) {
            $discount = (int) round($subtotalMinor * $this->value / 100);

            if ($this->max_discount_minor !== null) {
                $discount = min($discount, $this->max_discount_minor);
            }

            return min($discount, $subtotalMinor);
        }

        return min($this->value, $subtotalMinor);
    }
}
