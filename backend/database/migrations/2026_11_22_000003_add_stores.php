<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-store support: every sign-up creates its own store, and all store data
 * (products, sales, logs, settings, staff) belongs to exactly one store.
 *
 * Existing data is moved into one store so nothing is lost.
 */
return new class extends Migration
{
    private array $tables = ['users', 'products', 'categories', 'orders', 'sales', 'inventory_logs', 'settings'];

    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->unsignedBigInteger('store_id')->nullable()->index();
            });
        }

        // Barcodes and setting names only need to be unique inside one store.
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['barcode']);
            $table->unique(['store_id', 'barcode']);
        });
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['key']);
            $table->unique(['store_id', 'key']);
        });

        // Put everything that already exists into one store.
        if (DB::table('users')->exists() || DB::table('products')->exists()) {
            $storeId = DB::table('stores')->insertGetId([
                'name' => 'My Store',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            foreach ($this->tables as $name) {
                DB::table($name)->whereNull('store_id')->update(['store_id' => $storeId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['store_id', 'key']);
            $table->unique(['key']);
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['store_id', 'barcode']);
            $table->unique(['barcode']);
        });
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropIndex(['store_id']);
                $table->dropColumn('store_id');
            });
        }
        Schema::dropIfExists('stores');
    }
};
