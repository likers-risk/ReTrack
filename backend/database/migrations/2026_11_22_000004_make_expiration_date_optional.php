<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Some products (soap, tools, etc.) don't expire, so the expiration date is optional. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->date('expiration_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Can't safely make it required again if some products have no date.
    }
};
