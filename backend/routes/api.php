<?php

use App\Http\Controllers\MailController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\AdminOnly;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group( function () {
    Route::post('/login',[UserController::class, 'login']);
    Route::post('/signup',[UserController::class, 'signup']);
});


Route::middleware('auth:sanctum')->group( function () {
    // Admin only: managing accounts and changing products
    Route::middleware(AdminOnly::class)->group(function () {
        Route::post('/register', [UserController::class, 'register']);
        Route::get('/users/pending', [UserController::class, 'pendingUsers']);
        Route::put('/users/{id}/approve', [UserController::class, 'approveUser']);
        Route::delete('/users/{id}/reject', [UserController::class, 'rejectUser']);
        Route::apiResource('products', ProductController::class)->only(['store', 'update', 'destroy']);
    });

    Route::post('/logout',[UserController::class, 'logout']);
    // Everyone logged in (Admin and Staff) can view products
    Route::get('/products/barcode/{barcode}', [ProductController::class, 'findByBarcode']);
    Route::apiResource('products', ProductController::class)->only(['index', 'show']);
    Route::post('/purchase',[OrderController::class, 'purchaseProducts']);
    Route::get('/orders/{id}',[OrderController::class, 'customerOrders']);
    Route::get('/search-product',[ProductController::class, 'searchProduct']);
    Route::get('/user-profile/{id}',[UserController::class, 'index']);
    Route::get('/total-sales',[OrderController::class, 'totalSales']);
    Route::get('/sales-revenue',[OrderController::class, 'totalRevenue']);
    Route::post('/edit-profile',[UserController::class, 'updateProfile']);
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/totals', [SaleController::class, 'totals']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);
    Route::put('/sales/{id}', [SaleController::class, 'update']);
    Route::delete('/sales/{id}', [SaleController::class, 'destroy']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/toggle-read', [NotificationController::class, 'toggleRead']);
    Route::delete('/notifications/clear-all', [NotificationController::class, 'clearAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::get('/low-stock', [ProductController::class, 'lowStock']);
    Route::get('/top-products', [ProductController::class, 'topProducts']);
});


