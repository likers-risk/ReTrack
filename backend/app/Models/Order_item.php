<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order_item extends Model
{
    protected $fillable = [
        'product_id',
        'quantity',
        'list_price'
    ];

    // Always send these as numbers (Postgres returns decimals as text).
    protected $casts = [
        'list_price' => 'float',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }


    public function orders()
    {
        return $this->belongsTo(Order::class);
    }
}
