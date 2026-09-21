<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    public const STATUS_CREATED = 'created';

    public const STATUS_AUTHORIZED = 'authorized';

    public const STATUS_CAPTURED = 'captured';

    public const STATUS_FAILED = 'failed';

    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'order_id',
        'gateway',
        'gateway_order_id',
        'gateway_payment_id',
        'status',
        'amount_minor',
        'currency',
        'raw_response',
    ];

    protected function casts(): array
    {
        return [
            'amount_minor' => 'integer',
            'raw_response' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
