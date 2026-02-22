<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('quote_line_items', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('quote_id', 36);
            $table->char('requisition_line_item_id', 36);
            $table->decimal('unit_price', 15, 4);
            $table->decimal('line_total', 15, 4)->default(0); // SYSTEM-CALCULATED
            $table->timestamps();

            $table->unique(['quote_id', 'requisition_line_item_id']);
            $table->foreign('quote_id')->references('id')->on('vendor_quotes')->cascadeOnDelete();
            $table->foreign('requisition_line_item_id')->references('id')->on('requisition_line_items');
            $table->index('quote_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_line_items');
    }
};
