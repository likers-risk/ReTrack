<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = ['product', 'amount', 'date'];

    // Always send these as numbers (Postgres returns decimals as text).
    protected $casts = [
        'amount' => 'float',
    ];
}
