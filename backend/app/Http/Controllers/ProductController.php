<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Order_item;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = Product::with(['categories', 'stocks'])->get();

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

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        $validatedData = $request->validate([
            'product_name' => 'required|string|max:255',
            'category_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost' => 'required|numeric',
            'quantity' => 'required|integer|min:0',
            'expiration_date' => 'required|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);


        $category = Category::firstOrCreate(['category_name' => $validatedData['category_name']]);


        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('images', 'public');
        }

        $checkProduct = Product::where('product_name',$validatedData['product_name'])->first();

        if($checkProduct) {
            return response()->json([
                'message' => 'Product already exists'
            ],409);
        }

        $product = Product::create([
            'product_name' => $validatedData['product_name'],
            'description' => $validatedData['description'],
            'category_name' => $validatedData['category_name'],
            'price' => $validatedData['price'],
            'cost' => $validatedData['cost'],
            'expiration_date' => $validatedData['expiration_date'],
            'category_id' => $category->id,
            'image' => $imagePath,
        ]);

        $stocks = Stock::create([
            'product_id' => $product->id,
            'quantity' => $validatedData['quantity']
        ]);


        return response()->json([
            'message' => 'Product added successfully.',
            'product' => $product,
            'category' => $category,
            'stocks' => $stocks
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load(['categories', 'stocks']);
        $product->image_url = $product->image ? asset('storage/' . $product->image) : null;

        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $validatedData = $request->validate([
            'product_name' => 'sometimes|string|max:255',
            'category_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost' => 'required|numeric',
            'stocks.quantity' => 'required|integer|min:0', 
            'expiration_date' => 'sometimes|date',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048'
        ]);

        $category = Category::firstOrCreate([
            'category_name' => $validatedData['category_name']
        ]);

        $imagePath = $product->image;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('images', 'public');
        }

        $product->update([
            'product_name' => $validatedData['product_name'],
            'description' => $validatedData['description'],
            'price' => $validatedData['price'],
            'expiration_date' => $validatedData['expiration_date'] ?? $product->expiration_date,
            'category_id' => $category->id,
            'image' => $imagePath,
        ]);

       
        $product->stocks()->update([
            'quantity' => $validatedData['stocks']['quantity']
        ]);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->load(['category', 'stocks'])
        ], 200);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'message' => 'Deleted Successfully'
        ]);
    }

    public function searchProduct(Request $request)
    {
        $query = $request->input('query');

        $product = collect();

        if ($query) {
            $product = Product::where('product_name', 'LIKE', "%{$query}%")
                ->orWhere('description', 'LIKE', "%{$query}%")
                ->orderBy('product_name')
                ->get();
        }

        return response()->json([
            'products' => $product,
            'query' => $query
        ]);
    }

    public function lowStock()
    {
        try {
            $lowStockProducts = Product::with('stocks')
                ->get()
                ->filter(fn($product) => $product->stocks->quantity < 5)
                ->map(fn($product) => [
                    'id' => $product->id,
                    'name' => $product->product_name,
                    'quantity' => $product->stocks->quantity,
                    'price' => $product->price,
                    'image' => $product->image,
                ])
                ->values();

            return response()->json([
                'low_stock' => $lowStockProducts
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch low stock products',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    public function topProducts()
    {
        try {
            $topProducts = Order_item::select(
                'product_id',
                DB::raw('SUM(quantity) as total_sold')
            )
                ->with('product:id,product_name,price,image')
                ->groupBy('product_id')
                ->orderByDesc('total_sold')
                ->take(5)
                ->get()
                ->map(fn($item) => [
                    'id' => $item->product->id,
                    'name' => $item->product->product_name,
                    'price' => $item->product->price,
                    'image' => $item->product->image,
                    'sold' => $item->total_sold,
                ]);

            return response()->json([
                'top_products' => $topProducts
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch top products',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
