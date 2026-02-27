<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('grns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ref_number')->unique();
            $table->uuid('purchase_order_id');
            $table->date('received_date');
            $table->string('received_by');
            $table->text('remarks')->nullable();
            $table->string('status')->default('received'); // received, cancelled
            $table->timestamps();

            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->onDelete('cascade');
        });

        Schema::create('grn_line_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('grn_id');
            $table->uuid('po_line_item_id');
            $table->decimal('quantity_received', 15, 4);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('grn_id')->references('id')->on('grns')->onDelete('cascade');
            $table->foreign('po_line_item_id')->references('id')->on('po_line_items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_line_items');
        Schema::dropIfExists('grns');
    }
};
