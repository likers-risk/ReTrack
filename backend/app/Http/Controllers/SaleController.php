<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;

class SaleController extends Controller
{
   
    public function index(Request $request)
    {
        $query = Sale::query();

        // Optional date filter
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        // Sort by latest
        $sales = $query->orderBy('date', 'asc')->get();

        return response()->json(['sales' => $sales]);
    }

    // Create new sale
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product' => 'required|string',
            'amount' => 'required|numeric',
            'date' => 'required|date',
        ]);

        $sale = Sale::create($validated);

        return response()->json(['sale' => $sale], 201);
    }

    // Get a single sale
    public function show($id)
    {
        $sale = Sale::findOrFail($id);
        return response()->json(['sale' => $sale]);
    }

    // Update a sale
    public function update(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);

        $validated = $request->validate([
            'product' => 'sometimes|string',
            'amount' => 'sometimes|numeric',
            'date' => 'sometimes|date',
        ]);

        $sale->update($validated);

        return response()->json(['sale' => $sale]);
    }

    // Delete a sale
    public function destroy($id)
    {
        $sale = Sale::findOrFail($id);
        $sale->delete();

        return response()->json(['message' => 'Sale deleted']);
    }

    // Total sales
    public function totals()
    {
        $totalAmount = Sale::sum('amount');
        $todayAmount = Sale::whereDate('date', now())->sum('amount');
        $ordersCount = Sale::count();

        return response()->json([
            'total_amount' => $totalAmount,
            'today_amount' => $todayAmount,
            'orders_count' => $ordersCount,
        ]);
    }
}
