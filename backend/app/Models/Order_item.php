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

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }


    public function orders()
    {
        return $this->belongsTo(Order::class);
    }
}
