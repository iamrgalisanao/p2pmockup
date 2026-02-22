<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('po_line_items', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('purchase_order_id', 36);
            $table->text('description');
            $table->string('unit');
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_price', 15, 4);
            $table->decimal('line_total', 15, 4)->default(0); // SYSTEM-CALCULATED
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('po_line_items');
    }
};
