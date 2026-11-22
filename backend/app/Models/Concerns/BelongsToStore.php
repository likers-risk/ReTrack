<?php

namespace App\Models\Concerns;

use App\Models\Store;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Keeps each store's data separate.
 *
 * - Reading: when someone is logged in, queries only return rows from their store.
 * - Saving: new rows are automatically tagged with the logged-in user's store.
 */
trait BelongsToStore
{
    public static function bootBelongsToStore(): void
    {
        static::addGlobalScope('store', function (Builder $query) {
            $user = Auth::user();
            if ($user) {
                $query->where($query->getModel()->getTable() . '.store_id', $user->store_id);
            }
        });

        static::creating(function ($model) {
            if (empty($model->store_id) && ($user = Auth::user())) {
                $model->store_id = $user->store_id;
            }
        });
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /** The logged-in user's store id (null when nobody is logged in). */
    public static function currentStoreId(): ?int
    {
        return Auth::user()?->store_id;
    }
}
