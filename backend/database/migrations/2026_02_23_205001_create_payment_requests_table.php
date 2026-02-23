<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('ref_number')->unique(); // RF-YYYY-#####
            $table->enum('request_type', ['po_based', 'non_po', 'reimbursement', 'cash_advance'])->default('po_based');

            $table->char('requisition_id', 36)->nullable(); // Optional link to PR
            $table->char('purchase_order_id', 36)->nullable(); // Optional link to PO

            $table->string('title');
            $table->text('particulars')->nullable();

            $table->string('payee_name');
            $table->char('vendor_id', 36)->nullable(); // Link to Vendor if catalogued

            $table->decimal('amount', 15, 2);
            $table->date('due_date');
            $table->string('payment_terms')->nullable();

            $table->char('department_id', 36);
            $table->string('cost_center')->nullable();
            $table->string('gl_suggestion')->nullable();
            $table->string('tax_code')->nullable();
            $table->string('withholding_tax')->nullable();

            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'for_approval',
                'approved',
                'rejected',
                'on_hold',
                'sap_synced',
                'paid',
                'closed',
                'cancelled'
            ])->default('draft');

            // Check / SAP Milestones
            $table->string('apv_number')->nullable();
            $table->string('cv_number')->nullable();
            $table->string('check_number')->nullable();
            $table->date('available_date')->nullable();
            $table->date('release_date')->nullable();

            $table->enum('sap_sync_status', ['pending', 'synced', 'failed'])->default('pending');
            $table->text('sap_error')->nullable();

            $table->char('requested_by', 36);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->foreign('requisition_id')->references('id')->on('requisitions')->nullOnDelete();
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->nullOnDelete();
            $table->foreign('vendor_id')->references('id')->on('vendors')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('departments');
            $table->foreign('requested_by')->references('id')->on('users');

            $table->index(['status', 'department_id']);
            $table->index('requested_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};
