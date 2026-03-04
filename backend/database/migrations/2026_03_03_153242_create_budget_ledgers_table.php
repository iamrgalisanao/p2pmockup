<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('budget_ledgers', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('department_id', 36);
            $table->char('project_id', 36)->nullable();

            // Transaction links
            $table->char('requisition_id', 36)->nullable();
            $table->char('purchase_order_id', 36)->nullable();
            $table->char('payment_request_id', 36)->nullable();

            // Ledger data
            $table->enum('type', ['pre_encumbrance', 'encumbrance', 'actual', 'adjustment']);
            $table->decimal('amount', 15, 4);
            $table->string('description')->nullable();
            $table->string('reference_number')->nullable(); // PR/PO/INV number

            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments');
            $table->foreign('project_id')->references('id')->on('departments');
            $table->foreign('requisition_id')->references('id')->on('requisitions')->nullOnDelete();
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->nullOnDelete();
            $table->foreign('payment_request_id')->references('id')->on('payment_requests')->nullOnDelete();

            $table->index(['department_id', 'type']);
            $table->index(['project_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_ledgers');
    }
};
