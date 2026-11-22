<?php

use App\Http\Controllers\MailController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\InventoryLogController;
use App\Http\Controllers\ReportController;
use App\Http\Middleware\AdminOnly;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/login', [UserController::class, 'login']);
    Route::post('/signup', [UserController::class, 'signup']);
});


Route::middleware('auth:sanctum')->group(function () {

    // ---------- Admin only ----------
    Route::middleware(AdminOnly::class)->group(function () {
        // Accounts
        Route::post('/register', [UserController::class, 'register']);
        Route::get('/users/pending', [UserController::class, 'pendingUsers']);
        Route::put('/users/{id}/approve', [UserController::class, 'approveUser']);
        Route::delete('/users/{id}/reject', [UserController::class, 'rejectUser']);

        // Products: add, edit, archive
        Route::apiResource('products', ProductController::class)->only(['store', 'update', 'destroy']);

        // Settings (pricing formula, alert thresholds), inventory log, reports
        Route::put('/settings', [SettingController::class, 'update']);
        Route::get('/inventory-logs', [InventoryLogController::class, 'index']);
        Route::get('/reports', [ReportController::class, 'index']);

        // Sales history can only be created, edited or deleted by an Admin
        Route::post('/sales', [SaleController::class, 'store']);
        Route::put('/sales/{id}', [SaleController::class, 'update']);
        Route::delete('/sales/{id}', [SaleController::class, 'destroy']);
    });

    // ---------- Everyone logged in (Admin and Staff) ----------
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/user-profile/{id}', [UserController::class, 'index']);
    Route::post('/edit-profile', [UserController::class, 'updateProfile']);

    // Products: view, search, scan
    Route::get('/products/barcode/{barcode}', [ProductController::class, 'findByBarcode']);
    Route::apiResource('products', ProductController::class)->only(['index', 'show']);
    Route::get('/search-product', [ProductController::class, 'searchProduct']);

    // Stock in/out (SRS: staff update stock when restocking or removing expired/damaged items)
    Route::post('/products/{product}/restock', [ProductController::class, 'restock']);
    Route::post('/products/{product}/remove-stock', [ProductController::class, 'removeStock']);

    // Alerts and settings
    Route::get('/low-stock', [ProductController::class, 'lowStock']);
    Route::get('/expiring', [ProductController::class, 'expiring']);
    Route::get('/top-products', [ProductController::class, 'topProducts']);
    Route::get('/settings', [SettingController::class, 'index']);

    // Selling
    Route::post('/purchase', [OrderController::class, 'purchaseProducts']);
    Route::get('/total-sales', [OrderController::class, 'totalSales']);
    Route::get('/sales-revenue', [OrderController::class, 'totalRevenue']);
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/totals', [SaleController::class, 'totals']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/toggle-read', [NotificationController::class, 'toggleRead']);
    Route::delete('/notifications/clear-all', [NotificationController::class, 'clearAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
});
