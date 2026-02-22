<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vendor_quotes', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('requisition_id', 36);
            $table->char('vendor_id', 36);
            $table->char('submitted_by', 36); // internal user who entered the quote
            $table->decimal('grand_total', 15, 4)->default(0); // SYSTEM-CALCULATED
            $table->boolean('is_complete')->default(false);   // SYSTEM-CALCULATED
            $table->boolean('is_compliant')->nullable();      // User-set by proc_officer
            $table->text('compliance_notes')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_awarded')->default(false);
            $table->timestamps();

            $table->unique(['requisition_id', 'vendor_id']); // One quote per vendor per PR
            $table->foreign('requisition_id')->references('id')->on('requisitions')->cascadeOnDelete();
            $table->foreign('vendor_id')->references('id')->on('vendors');
            $table->foreign('submitted_by')->references('id')->on('users');
            $table->index('requisition_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_quotes');
    }
};
