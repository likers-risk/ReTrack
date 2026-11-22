<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    use HasUuids;
    protected $fillable = [
        'category_id',
        'product_name',
        'barcode',
        'description',
        'price',
        'cost',
        'expiration_date',
        'image'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Always include the category's name when a product is sent to the frontend. */
    protected $appends = ['category_name'];

    // Always send prices as numbers (Postgres returns decimals as text).
    protected $casts = [
        'price' => 'float',
        'cost' => 'float',
    ];

    public function getCategoryNameAttribute(): ?string
    {
        return $this->categories?->category_name;
    }

    public function categories()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function stocks()
    {
        return $this->hasOne(Stock::class);
    }

    public function order_items() {
        return $this->hasMany(Order_item::class);
    }
}
