<?php

namespace App\Http\Controllers;

use App\Models\InventoryLog;
use Illuminate\Http\Request;

class InventoryLogController extends Controller
{
    /** Admin: list stock changes, newest first. Optional filters: type, product_id, from, to. */
    public function index(Request $request)
    {
        $request->validate([
            'type' => 'nullable|in:added,sold,restocked,adjusted,expired,damaged,archived',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $query = InventoryLog::query()->orderByDesc('created_at')->orderByDesc('id');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        return response()->json(['logs' => $query->limit(500)->get()]);
    }
}
