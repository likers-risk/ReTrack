<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks anyone who is not an Admin (e.g. Staff) from the route.
 */
class AdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== 'Admin') {
            return response()->json([
                'message' => 'Only admins can do this.'
            ], 403);
        }

        return $next($request);
    }
}
