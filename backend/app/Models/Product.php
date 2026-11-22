<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    // SoftDeletes: "deleting" a product archives it, so its sales history stays in reports.
    use HasUuids, SoftDeletes, BelongsToStore;

    protected $fillable = [
        'category_id',
        'product_name',
        'barcode',
        'description',
        'supplier',
        'price',
        'cost',
        'auto_price',
        'expiration_date',
        'image'
    ];

    /** Always include these computed values when a product is sent to the frontend. */
    protected $appends = ['category_name', 'suggested_price'];

    // Always send prices as numbers (Postgres returns decimals as text).
    protected $casts = [
        'price' => 'float',
        'cost' => 'float',
        'auto_price' => 'boolean',
    ];

    /** Suggested Retail Price = cost + markup% (markup is set by the Admin in Settings). */
    public static function srpFor(float $cost, ?float $markup = null): float
    {
        $markup = $markup ?? Setting::markup();
        return round($cost * (1 + $markup / 100), 2);
    }

    public function getSuggestedPriceAttribute(): float
    {
        return static::srpFor((float) $this->cost);
    }

    public function getCategoryNameAttribute(): ?string
    {
        return $this->categories?->category_name;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categories()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function stocks()
    {
        return $this->hasOne(Stock::class);
    }

    public function order_items()
    {
        return $this->hasMany(Order_item::class);
    }
}
