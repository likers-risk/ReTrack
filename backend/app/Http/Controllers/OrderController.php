<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Order;
use App\Models\Order_item;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
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
            ]);

            $user = $request->user();

            DB::beginTransaction();

            $totalPrice = 0;
            $orderItems = [];
            $salesRecords = [];
            $lowStockNotifications = [];

            foreach ($validatedData['cart_items'] as $item) {
                $product = Product::with('stocks')->findOrFail($item['product_id']);
                $quantity = $item['quantity'];


                if ($product->stocks->quantity < $quantity) {
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
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $salesRecords[] = [
                    'product' => $product->product_name,
                    'amount' => $lineTotal,
                    'date' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];


                $product->stocks->decrement('quantity', $quantity);

                if ($product->stocks->quantity < 5) {
                    $message = 'Stock of ' . $product->product_name . ' is low (only ' . $product->stocks->quantity . ' left).';

                    Notification::create([
                        'user_id' => $user->id,
                        'title' => $product->product_name,
                        'message' => $message,
                        'read' => false,
                    ]);


                    $lowStockNotifications[] = $message;
                }
            }


            $order = Order::create([
                'user_id' => $user->id,
                'total_price' => $totalPrice,
            ]);

            $order->orderItems()->createMany($orderItems);


            foreach ($salesRecords as $sale) {
                Sale::create($sale);
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
            'total_sales' => $totalSales,
        ]);
    }

    public function totalRevenue()
    {

        $totalSales = Sale::sum('amount');


        $totalCostOfSold = DB::table('sales')
            ->join('products', 'sales.product', '=', 'products.product_name')
            ->sum(DB::raw('products.cost'));

        $revenue = $totalSales - $totalCostOfSold;

        return response()->json([
            'revenue' => $revenue,
        ]);
    }
}
