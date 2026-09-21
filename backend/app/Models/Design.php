<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Design extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id', 'garment_id', 'name', 'configuration', 'preview_image_url'];

    protected function casts(): array
    {
        return [
            'configuration' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function garment(): BelongsTo
    {
        return $this->belongsTo(Garment::class);
    }
}
