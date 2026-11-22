<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Links products.category_id to categories.id.
     * This has to run AFTER the categories table exists (Postgres/MySQL
     * check this; SQLite databases made before this fix already have the link).
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->foreign('category_id')
                ->references('id')->on('categories')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });
    }
};
