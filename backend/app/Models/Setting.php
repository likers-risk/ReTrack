<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;

/**
 * Simple key/value store for store-wide settings set by the Admin.
 */
class Setting extends Model
{
    use BelongsToStore;

    protected $fillable = ['key', 'value'];

    public const DEFAULTS = [
        'markup_percent' => 20,      // SRP = cost + markup%
        'low_stock_threshold' => 5,  // alert when stock is at or below this
        'expiry_alert_days' => 30,   // alert when expiring within this many days
    ];

    public static function getValue(string $key)
    {
        $value = static::where('key', $key)->value('value');
        return $value === null ? (static::DEFAULTS[$key] ?? null) : $value;
    }

    public static function setValue(string $key, $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => (string) $value]);
    }

    /** All settings as numbers, with defaults filled in. */
    public static function allValues(): array
    {
        $stored = static::pluck('value', 'key')->all();
        $out = [];
        foreach (static::DEFAULTS as $key => $default) {
            $out[$key] = (float) ($stored[$key] ?? $default);
        }
        return $out;
    }

    public static function markup(): float
    {
        return (float) static::getValue('markup_percent');
    }

    public static function lowStockThreshold(): int
    {
        return (int) static::getValue('low_stock_threshold');
    }

    public static function expiryAlertDays(): int
    {
        return (int) static::getValue('expiry_alert_days');
    }
}
