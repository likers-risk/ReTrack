<?php

namespace App\Http\Controllers;

use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    /** Everyone can read the settings (the app needs them for alerts and suggested prices). */
    public function index(Request $request)
    {
        return response()->json([
            'settings' => Setting::allValues(),
            'store_name' => $request->user()->store?->name,
        ]);
    }

    /** Admin: change the pricing formula and alert thresholds. */
    public function update(Request $request)
    {
        $request->validate(['store_name' => 'nullable|string|max:255']);
        if ($request->filled('store_name') && $request->user()->store) {
            $request->user()->store->update(['name' => trim($request->store_name)]);
        }

        $data = $request->validate([
            'markup_percent' => 'required|numeric|min:0|max:1000',
            'low_stock_threshold' => 'required|integer|min:0|max:100000',
            'expiry_alert_days' => 'required|integer|min:0|max:3650',
        ]);

        $updated = DB::transaction(function () use ($data) {
            foreach ($data as $key => $value) {
                Setting::setValue($key, $value);
            }

            // Re-price every product that follows the formula.
            $count = 0;
            Product::where('auto_price', true)->get()->each(function ($product) use ($data, &$count) {
                $newPrice = Product::srpFor((float) $product->cost, (float) $data['markup_percent']);
                if ((float) $product->price !== $newPrice) {
                    $product->update(['price' => $newPrice]);
                    $count++;
                }
            });
            return $count;
        });

        return response()->json([
            'message' => $updated
                ? "Settings saved. Updated the price of {$updated} auto-priced product(s)."
                : 'Settings saved.',
            'settings' => Setting::allValues(),
            'store_name' => $request->user()->fresh()->store?->name,
        ]);
    }
}
