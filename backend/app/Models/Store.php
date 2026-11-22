<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One business using ReTrack. Each store only ever sees its own data. */
class Store extends Model
{
    protected $fillable = ['name'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
