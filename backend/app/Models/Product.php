<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'short_description',
        'base_price_minor',
        'is_customizable',
        'is_active',
        'is_featured',
        'rating_avg',
        'rating_count',
    ];

    protected function casts(): array
    {
        return [
            'base_price_minor' => 'integer',
            'is_customizable' => 'boolean',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'rating_avg' => 'decimal:2',
            'rating_count' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class, 'collection_product')
            ->withPivot('sort_order')
            ->withTimestamps();
    }

    public function wishlistedBy(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }
}
