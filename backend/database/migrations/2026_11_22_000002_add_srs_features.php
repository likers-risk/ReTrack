<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds what the SRS needs:
 * - products: supplier, automatic pricing, archive (soft delete) so sales history is kept
 * - orders: payment method, offline sync reference
 * - order_items: cost at time of sale (accurate profit reports)
 * - settings: pricing formula and alert thresholds
 * - inventory_logs: who changed which stock, when, and why
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('supplier')->nullable();
            $table->boolean('auto_price')->default(false);
            $table->softDeletes();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_method', 20)->default('cash');
            $table->string('client_ref', 64)->nullable()->unique();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('unit_cost', 10, 2)->nullable();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('product_id')->nullable()->index();
            $table->string('product_name');
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('username')->nullable();
            $table->string('type', 20); // added, sold, restocked, adjusted, expired, damaged, archived
            $table->integer('quantity_change')->default(0);
            $table->integer('quantity_after')->nullable();
            $table->string('note')->nullable();
            $table->string('client_ref', 64)->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
        Schema::dropIfExists('settings');
        Schema::table('order_items', fn (Blueprint $t) => $t->dropColumn('unit_cost'));
        Schema::table('orders', function (Blueprint $t) {
            $t->dropUnique(['client_ref']);
            $t->dropColumn(['payment_method', 'client_ref']);
        });
        Schema::table('products', function (Blueprint $t) {
            $t->dropSoftDeletes();
            $t->dropColumn(['supplier', 'auto_price']);
        });
    }
};
