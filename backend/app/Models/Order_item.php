<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order_item extends Model
{
    protected $fillable = [
        'product_id',
        'quantity',
        'list_price',
        'unit_cost'
    ];

    // Always send these as numbers (Postgres returns decimals as text).
    protected $casts = [
        'list_price' => 'float',
        'unit_cost' => 'float',
    ];

    public function product()
    {
        // withTrashed: archived products still show in sales history
        return $this->belongsTo(Product::class, 'product_id', 'id')->withTrashed();
    }


    public function orders()
    {
        return $this->belongsTo(Order::class);
    }
}
