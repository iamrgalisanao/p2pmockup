<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('ref_number')->unique(); // PO-YYYY-##### or JO-YYYY-#####
            $table->enum('type', ['purchase_order', 'job_order']);
            $table->char('requisition_id', 36)->unique(); // One PO/JO per requisition
            $table->char('vendor_id', 36);
            $table->char('awarded_quote_id', 36);
            $table->char('issued_by', 36);
            $table->timestamp('issued_at')->nullable();
            $table->decimal('subtotal', 15, 4)->default(0);  // SYSTEM-CALCULATED
            $table->decimal('tax', 15, 4)->default(0);       // SYSTEM-CALCULATED
            $table->decimal('grand_total', 15, 4)->default(0); // SYSTEM-CALCULATED
            $table->string('delivery_terms')->nullable();
            $table->string('payment_terms')->nullable();
            // Job Order extras
            $table->text('scope_of_work')->nullable();
            $table->date('completion_date')->nullable();
            $table->string('site_address')->nullable();
            $table->enum('status', ['draft', 'issued', 'mark_sent', 'acknowledged', 'completed', 'cancelled'])->default('draft');
            $table->timestamp('sent_at')->nullable();
            $table->string('pdf_storage_key')->nullable();
            $table->timestamps();

            $table->foreign('requisition_id')->references('id')->on('requisitions');
            $table->foreign('vendor_id')->references('id')->on('vendors');
            $table->foreign('awarded_quote_id')->references('id')->on('vendor_quotes');
            $table->foreign('issued_by')->references('id')->on('users');
            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
