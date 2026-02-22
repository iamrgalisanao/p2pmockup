<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('requisition_line_items', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('requisition_id', 36);
            $table->text('description');
            $table->text('specification')->nullable();
            $table->string('unit');
            $table->decimal('quantity', 15, 4);
            $table->decimal('estimated_unit_cost', 15, 4)->default(0);
            $table->decimal('line_total', 15, 4)->default(0); // SYSTEM-CALCULATED
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('requisition_id')->references('id')->on('requisitions')->cascadeOnDelete();
            $table->index('requisition_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisition_line_items');
    }
};
