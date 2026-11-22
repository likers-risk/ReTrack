<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total_price',
        'payment_method',
        'client_ref',
        'created_at'
    ];

    // Always send these as numbers (Postgres returns decimals as text).
    protected $casts = [
        'total_price' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orderItems():HasMany {
        return $this->hasMany(Order_item::class);
    }
}
