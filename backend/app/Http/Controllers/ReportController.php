<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Admin: sales and profit report for a date range,
     * broken down by period (day/week/month), product, category, and payment method.
     */
    public function index(Request $request)
    {
        $data = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'group' => 'nullable|in:day,week,month,year',
        ]);

        $tz = config('app.timezone');
        $to = isset($data['to']) ? Carbon::parse($data['to'], $tz)->endOfDay() : now()->endOfDay();
        $from = isset($data['from']) ? Carbon::parse($data['from'], $tz)->startOfDay() : $to->copy()->subDays(29)->startOfDay();
        $group = $data['group'] ?? 'day';

        $rows = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('orders.created_at', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->select([
                'orders.id as order_id',
                'orders.created_at',
                'orders.payment_method',
                'products.id as product_id',
                'products.product_name',
                'categories.category_name',
                'order_items.quantity',
                'order_items.list_price',
                DB::raw('COALESCE(order_items.unit_cost, products.cost) as unit_cost'),
            ])
            ->get();

        $periodKey = function (Carbon $date) use ($group) {
            return match ($group) {
                'week' => $date->copy()->startOfWeek()->toDateString(),
                'month' => $date->format('Y-m'),
                'year' => $date->format('Y'),
                default => $date->toDateString(),
            };
        };

        $blank = fn ($extra = []) => array_merge(['sales' => 0.0, 'cost' => 0.0, 'profit' => 0.0, 'items' => 0], $extra);
        $totals = $blank(['orders' => 0]);
        $byPeriod = [];
        $byProduct = [];
        $byCategory = [];
        $byPayment = [];
        $orders = [];
        $ordersByPayment = [];

        // Adds one sold line to a group (a day, a product, a category...)
        $add = function (array &$bucket, $key, array $label, float $sales, float $cost, int $qty) use ($blank) {
            $bucket[$key] ??= $blank($label);
            $bucket[$key]['sales'] += $sales;
            $bucket[$key]['cost'] += $cost;
            $bucket[$key]['profit'] += $sales - $cost;
            $bucket[$key]['items'] += $qty;
        };

        foreach ($rows as $r) {
            $qty = (int) $r->quantity;
            $sales = $qty * (float) $r->list_price;
            $cost = $qty * (float) $r->unit_cost;
            $period = $periodKey(Carbon::parse($r->created_at, $tz));
            $category = $r->category_name ?: 'Uncategorized';
            $payment = $r->payment_method ?: 'cash';

            $add($byPeriod, $period, ['period' => $period], $sales, $cost, $qty);
            $add($byProduct, $r->product_id, ['product' => $r->product_name], $sales, $cost, $qty);
            $add($byCategory, $category, ['category' => $category], $sales, $cost, $qty);
            $add($byPayment, $payment, ['payment_method' => $payment], $sales, $cost, $qty);

            $totals['sales'] += $sales;
            $totals['cost'] += $cost;
            $totals['profit'] += $sales - $cost;
            $totals['items'] += $qty;
            $orders[$r->order_id] = true;
            $ordersByPayment[$payment][$r->order_id] = true;
        }
        $totals['orders'] = count($orders);
        foreach ($byPayment as $key => &$row) {
            $row['orders'] = count($ordersByPayment[$key] ?? []);
        }
        unset($row);

        $round = function (array $list) {
            return array_values(array_map(function ($row) {
                foreach (['sales', 'cost', 'profit'] as $k) {
                    $row[$k] = round($row[$k], 2);
                }
                $row['margin'] = $row['sales'] > 0 ? round($row['profit'] / $row['sales'] * 100, 1) : 0;
                return $row;
            }, $list));
        };

        ksort($byPeriod);
        $products = $round($byProduct);
        usort($products, fn ($a, $b) => $b['sales'] <=> $a['sales']);
        $categories = $round($byCategory);
        usort($categories, fn ($a, $b) => $b['sales'] <=> $a['sales']);

        return response()->json([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'group' => $group,
            'totals' => $round([$totals])[0],
            'by_period' => $round($byPeriod),
            'by_product' => $products,
            'by_category' => $categories,
            'by_payment_method' => $round($byPayment),
        ]);
    }
}
