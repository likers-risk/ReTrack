<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use BelongsToStore;

    protected $fillable = ['product', 'amount', 'date'];

    // Always send these as numbers (Postgres returns decimals as text).
    protected $casts = [
        'amount' => 'float',
    ];
}
