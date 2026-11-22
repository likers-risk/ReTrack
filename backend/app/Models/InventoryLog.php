<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;

/**
 * One row per stock change: added, sold, restocked, adjusted, expired, damaged, archived.
 */
class InventoryLog extends Model
{
    use BelongsToStore;

    protected $fillable = [
        'product_id', 'product_name', 'user_id', 'username', 'type',
        'quantity_change', 'quantity_after', 'note', 'client_ref', 'created_at',
    ];

    protected $casts = [
        'quantity_change' => 'integer',
        'quantity_after' => 'integer',
    ];

    public static function record(Product $product, ?User $user, string $type, int $change, ?int $after, ?string $note = null, array $extra = []): self
    {
        return static::create(array_merge([
            'product_id' => $product->id,
            'product_name' => $product->product_name,
            'user_id' => $user?->id,
            'username' => $user?->username,
            'type' => $type,
            'quantity_change' => $change,
            'quantity_after' => $after,
            'note' => $note,
        ], $extra));
    }
}
