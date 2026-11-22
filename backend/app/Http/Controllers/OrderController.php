<?php

namespace App\Http\Controllers;

use App\Models\InventoryLog;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Order_item;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function purchaseProducts(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'cart_items' => 'required|array|min:1',
                'cart_items.*.product_id' => 'required|uuid|exists:products,id',
                'cart_items.*.quantity' => 'required|integer|min:1',
                'payment_method' => 'nullable|in:cash,gcash,card,other',
                // Sent by the offline queue: a unique id per sale + when it really happened
                'client_ref' => 'nullable|string|max:64',
                'sold_at' => 'nullable|date|before_or_equal:' . now()->addMinutes(10)->toDateTimeString(),
            ]);

            $user = $request->user();
            $clientRef = $validatedData['client_ref'] ?? null;
            $isOfflineSync = $clientRef !== null;

            // Already synced before? Return it instead of recording the sale twice.
            if ($clientRef && ($existing = Order::where('client_ref', $clientRef)->first())) {
                return response()->json([
                    'message' => 'This offline sale was already synced.',
                    'duplicate' => true,
                    'order' => $existing->load('orderItems.product'),
                ], Response::HTTP_OK);
            }

            $soldAt = isset($validatedData['sold_at'])
                ? Carbon::parse($validatedData['sold_at'])->setTimezone(config('app.timezone'))
                : now();
            $threshold = Setting::lowStockThreshold();

            DB::beginTransaction();

            $totalPrice = 0;
            $orderItems = [];
            $salesRecords = [];
            $lowStockNotifications = [];
            $logs = [];

            foreach ($validatedData['cart_items'] as $item) {
                $product = Product::withTrashed()->with('stocks')->findOrFail($item['product_id']);
                $quantity = $item['quantity'];
                $stockBefore = $product->stocks->quantity;

                // Live sales can't sell more than what's in stock.
                // Offline sales already happened at the counter, so they are recorded anyway.
                if (!$isOfflineSync && $stockBefore < $quantity) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Insufficient stock for product: ' . $product->product_name
                    ], Response::HTTP_BAD_REQUEST);
                }

                $lineTotal = $product->price * $quantity;
                $totalPrice += $lineTotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'list_price' => $product->price,
                    'unit_cost' => $product->cost,
                    'created_at' => $soldAt,
                    'updated_at' => $soldAt,
                ];

                $salesRecords[] = [
                    'product' => $product->product_name,
                    'amount' => $lineTotal,
                    'date' => $soldAt,
                    'created_at' => $soldAt,
                    'updated_at' => $soldAt,
                ];

                $stockAfter = max(0, $stockBefore - $quantity);
                $product->stocks->update(['quantity' => $stockAfter]);

                $note = null;
                if ($isOfflineSync) {
                    $note = 'Offline sale synced';
                    if ($stockBefore < $quantity) {
                        $note .= " (stock was only {$stockBefore}; please recount)";
                    }
                }
                $logs[] = [$product, -$quantity, $stockAfter, $note];

                if ($stockAfter <= $threshold) {
                    $message = 'Stock of ' . $product->product_name . ' is low (only ' . $stockAfter . ' left).';
                    $lowStockNotifications[] = $message;
                }
            }

            $order = Order::create([
                'user_id' => $user->id,
                'total_price' => $totalPrice,
                'payment_method' => $validatedData['payment_method'] ?? 'cash',
                'client_ref' => $clientRef,
                'created_at' => $soldAt,
            ]);

            $order->orderItems()->createMany($orderItems);

            foreach ($salesRecords as $sale) {
                Sale::create($sale);
            }

            foreach ($logs as [$product, $change, $after, $note]) {
                InventoryLog::record($product, $user, 'sold', $change, $after, $note, ['created_at' => $soldAt]);
            }

            // Low-stock alerts go to everyone (Admin and Staff).
            if ($lowStockNotifications) {
                $userIds = User::where('status', 'approved')->pluck('id');
                foreach ($lowStockNotifications as $message) {
                    foreach ($userIds as $userId) {
                        Notification::create([
                            'user_id' => $userId,
                            'title' => 'Low stock',
                            'message' => $message,
                            'read' => false,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase completed successfully.',
                'order' => $order->load('orderItems.product'),
                'low_stock_notifications' => $lowStockNotifications,
            ], Response::HTTP_CREATED);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception $e) {
            DB::rollBack();
            report($e);
            return response()->json([
                'message' => 'An error occurred during the purchase.',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function totalSales()
    {

        $totalSales = Sale::sum('amount');

        return response()->json([
            'total_sales' => (float) $totalSales,
        ]);
    }

    public function totalRevenue()
    {

        // Profit = (selling price - cost) x quantity, for every item sold.
        $revenue = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->sum(DB::raw('order_items.quantity * (order_items.list_price - COALESCE(order_items.unit_cost, products.cost))'));

        return response()->json([
            'revenue' => (float) $revenue,
        ]);
    }
}
