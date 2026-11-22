<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Order_item;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    /** All products (archived ones are hidden). */
    public function index()
    {
        $products = Product::with(['categories', 'stocks'])->orderBy('product_name')->get();

        $products->transform(function ($product) {
            $product->image_url = $product->image
                ? asset('storage/' . $product->image)
                : null;
            return $product;
        });

        return response()->json([
            'message' => 'Products retrieved successfully',
            'products' => $products
        ], 200);
    }

    /** Add a product (Admin). */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'product_name' => 'required|string|max:255',
            'barcode' => [
                'nullable', 'string', 'max:64',
                Rule::unique('products', 'barcode')->where('store_id', $request->user()->store_id)->whereNull('deleted_at'),
            ],
            'category_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'supplier' => 'nullable|string|max:255',
            'auto_price' => 'nullable|boolean',
            'price' => 'required_unless:auto_price,1,true|nullable|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'expiration_date' => 'required|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if (Product::where('product_name', $validatedData['product_name'])->exists()) {
            return response()->json([
                'message' => 'Product already exists'
            ], 409);
        }

        $category = Category::firstOrCreate(['category_name' => $validatedData['category_name']]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('images', 'public');
        }

        $autoPrice = $request->boolean('auto_price');
        $price = $autoPrice
            ? Product::srpFor((float) $validatedData['cost'])
            : $validatedData['price'];

        $product = DB::transaction(function () use ($validatedData, $category, $imagePath, $autoPrice, $price, $request) {
            $product = Product::create([
                'product_name' => $validatedData['product_name'],
                'barcode' => $validatedData['barcode'] ?? null,
                'description' => $validatedData['description'] ?? null,
                'supplier' => $validatedData['supplier'] ?? null,
                'price' => $price,
                'cost' => $validatedData['cost'],
                'auto_price' => $autoPrice,
                'expiration_date' => $validatedData['expiration_date'],
                'category_id' => $category->id,
                'image' => $imagePath,
            ]);

            Stock::create([
                'product_id' => $product->id,
                'quantity' => $validatedData['quantity']
            ]);

            InventoryLog::record(
                $product, $request->user(), 'added',
                (int) $validatedData['quantity'], (int) $validatedData['quantity'], 'New product'
            );

            return $product;
        });

        return response()->json([
            'message' => 'Product added successfully.',
            'product' => $product->load(['categories', 'stocks']),
            'category' => $category,
            'stocks' => $product->stocks,
        ], 201);
    }

    public function show(Product $product)
    {
        $product->load(['categories', 'stocks']);
        $product->image_url = $product->image ? asset('storage/' . $product->image) : null;

        return response()->json($product);
    }

    /** Edit a product (Admin). A changed quantity is logged as a manual adjustment. */
    public function update(Request $request, Product $product)
    {
        $validatedData = $request->validate([
            'product_name' => 'sometimes|string|max:255',
            'barcode' => [
                'nullable', 'string', 'max:64',
                Rule::unique('products', 'barcode')->ignore($product->id)->where('store_id', $request->user()->store_id)->whereNull('deleted_at'),
            ],
            'category_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'supplier' => 'nullable|string|max:255',
            'auto_price' => 'nullable|boolean',
            'price' => 'required_unless:auto_price,1,true|nullable|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'stocks.quantity' => 'required|integer|min:0',
            'expiration_date' => 'sometimes|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048'
        ]);

        $category = isset($validatedData['category_name'])
            ? Category::firstOrCreate(['category_name' => $validatedData['category_name']])
            : $product->categories;

        $imagePath = $product->image;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('images', 'public');
        }

        $autoPrice = $request->has('auto_price') ? $request->boolean('auto_price') : $product->auto_price;
        $price = $autoPrice
            ? Product::srpFor((float) $validatedData['cost'])
            : $validatedData['price'];

        DB::transaction(function () use ($product, $validatedData, $category, $imagePath, $autoPrice, $price, $request) {
            $product->update([
                'product_name' => $validatedData['product_name'] ?? $product->product_name,
                'barcode' => $validatedData['barcode'] ?? null,
                'description' => $validatedData['description'] ?? null,
                'supplier' => $validatedData['supplier'] ?? null,
                'price' => $price,
                'cost' => $validatedData['cost'],
                'auto_price' => $autoPrice,
                'expiration_date' => $validatedData['expiration_date'] ?? $product->expiration_date,
                'category_id' => $category?->id ?? $product->category_id,
                'image' => $imagePath,
            ]);

            $stock = $product->stocks()->firstOrCreate([], ['quantity' => 0]);
            $before = (int) $stock->quantity;
            $after = (int) $validatedData['stocks']['quantity'];
            if ($before !== $after) {
                $stock->update(['quantity' => $after]);
                InventoryLog::record($product, $request->user(), 'adjusted', $after - $before, $after, 'Edited by admin');
            }
        });

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->fresh()->load(['categories', 'stocks'])
        ], 200);
    }

    /**
     * "Delete" a product (Admin). The product is archived, not erased,
     * so past sales and reports stay correct.
     */
    public function destroy(Request $request, Product $product)
    {
        $quantity = (int) ($product->stocks->quantity ?? 0);
        InventoryLog::record($product, $request->user(), 'archived', 0, $quantity, 'Product removed from list');

        // Free the barcode so a new product can use it.
        $product->update(['barcode' => null]);
        $product->delete();

        return response()->json([
            'message' => 'Deleted Successfully'
        ]);
    }

    /** Add new stock (Admin and Staff). Supports offline sync via client_ref. */
    public function restock(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1|max:100000',
            'note' => 'nullable|string|max:255',
            'client_ref' => 'nullable|string|max:64',
            'done_at' => 'nullable|date|before_or_equal:' . now()->addMinutes(10)->toDateTimeString(),
        ]);

        return $this->changeStock($request, $product, 'restocked', (int) $data['quantity'], $data);
    }

    /** Remove stock that is expired, damaged, or miscounted (Admin and Staff). */
    public function removeStock(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1|max:100000',
            'reason' => 'required|in:expired,damaged,adjusted',
            'note' => 'nullable|string|max:255',
            'client_ref' => 'nullable|string|max:64',
            'done_at' => 'nullable|date|before_or_equal:' . now()->addMinutes(10)->toDateTimeString(),
        ]);

        return $this->changeStock($request, $product, $data['reason'], -(int) $data['quantity'], $data);
    }

    private function changeStock(Request $request, Product $product, string $type, int $change, array $data)
    {
        $clientRef = $data['client_ref'] ?? null;
        if ($clientRef && InventoryLog::where('client_ref', $clientRef)->exists()) {
            return response()->json([
                'message' => 'Already synced.',
                'duplicate' => true,
                'product' => $product->load(['categories', 'stocks']),
            ]);
        }

        $log = DB::transaction(function () use ($request, $product, $type, $change, $data, $clientRef) {
            $stock = $product->stocks()->lockForUpdate()->firstOrCreate([], ['quantity' => 0]);
            $after = max(0, (int) $stock->quantity + $change);
            $stock->update(['quantity' => $after]);

            $extra = ['client_ref' => $clientRef];
            if (!empty($data['done_at'])) {
                $extra['created_at'] = \Carbon\Carbon::parse($data['done_at'])->setTimezone(config('app.timezone'));
            }

            return InventoryLog::record(
                $product, $request->user(), $type, $change, $after,
                $data['note'] ?? ($clientRef ? 'Synced from offline' : null), $extra
            );
        });

        return response()->json([
            'message' => $change > 0
                ? "Added {$change} to {$product->product_name}."
                : 'Removed ' . abs($change) . " from {$product->product_name} ({$type}).",
            'log' => $log,
            'product' => $product->fresh()->load(['categories', 'stocks']),
        ]);
    }

    /** Find one product by its barcode (used by the scanner in Shopping). */
    public function findByBarcode(string $barcode)
    {
        $product = Product::with(['categories', 'stocks'])
            ->where('barcode', trim($barcode))
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'No product found with that barcode.'
            ], 404);
        }

        $product->image_url = $product->image ? asset('storage/' . $product->image) : null;

        return response()->json(['product' => $product]);
    }

    public function searchProduct(Request $request)
    {
        $query = $request->input('query');

        $product = collect();

        if ($query) {
            $term = '%' . mb_strtolower($query) . '%';
            $product = Product::with(['categories', 'stocks'])
                ->where(function ($q) use ($term, $query) {
                    $q->whereRaw('LOWER(product_name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(description) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(supplier) LIKE ?', [$term])
                        ->orWhere('barcode', trim($query));
                })
                ->orderBy('product_name')
                ->get();
        }

        return response()->json([
            'products' => $product,
            'query' => $query
        ]);
    }

    /** Products at or below the low-stock threshold set in Settings. */
    public function lowStock()
    {
        $threshold = Setting::lowStockThreshold();

        $lowStockProducts = Product::with('stocks')
            ->get()
            ->filter(fn($product) => ($product->stocks->quantity ?? 0) <= $threshold)
            ->map(fn($product) => [
                'id' => $product->id,
                'name' => $product->product_name,
                'quantity' => $product->stocks->quantity ?? 0,
                'price' => $product->price,
                'image' => $product->image,
            ])
            ->values();

        return response()->json([
            'low_stock' => $lowStockProducts,
            'threshold' => $threshold,
        ], Response::HTTP_OK);
    }

    /** Products that are expired or expire within the alert window set in Settings. */
    public function expiring()
    {
        $days = Setting::expiryAlertDays();
        $today = now()->startOfDay();
        $limit = now()->addDays($days)->endOfDay();

        $products = Product::with('stocks')
            ->whereDate('expiration_date', '<=', $limit->toDateString())
            ->orderBy('expiration_date')
            ->get()
            ->filter(fn($p) => ($p->stocks->quantity ?? 0) > 0)
            ->map(function ($p) use ($today) {
                $expiry = \Carbon\Carbon::parse($p->expiration_date)->startOfDay();
                $daysLeft = (int) $today->diffInDays($expiry, false);
                return [
                    'id' => $p->id,
                    'name' => $p->product_name,
                    'quantity' => $p->stocks->quantity ?? 0,
                    'expiration_date' => $expiry->toDateString(),
                    'days_left' => $daysLeft,
                    'expired' => $daysLeft < 0,
                ];
            })
            ->values();

        return response()->json([
            'expiring' => $products,
            'days' => $days,
        ]);
    }

    public function topProducts()
    {
        $topProducts = Order_item::select(
            'product_id',
            DB::raw('SUM(quantity) as total_sold')
        )
            ->with('product')
            // only this store's orders
            ->whereIn('order_id', Order::select('id'))
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get()
            ->filter(fn($item) => $item->product !== null)
            ->map(fn($item) => [
                'id' => $item->product->id,
                'name' => $item->product->product_name,
                'price' => $item->product->price,
                'image' => $item->product->image,
                'sold' => (int) $item->total_sold,
            ])
            ->values();

        return response()->json([
            'top_products' => $topProducts
        ], Response::HTTP_OK);
    }
}
