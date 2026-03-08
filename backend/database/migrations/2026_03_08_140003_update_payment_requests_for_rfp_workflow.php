<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            // Rename to po_jo_id
            $table->renameColumn('purchase_order_id', 'po_jo_id');

            // Add missing fields from Constitution
            if (!Schema::hasColumn('payment_requests', 'accounting_validated_by')) {
                $table->char('accounting_validated_by', 36)->nullable()->after('status');
                $table->foreign('accounting_validated_by')->references('id')->on('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('payment_requests', 'accounting_validated_at')) {
                $table->timestamp('accounting_validated_at')->nullable()->after('accounting_validated_by');
            }

            // Update status: in Laravel, to extend ENUM you can either 
            // 1. use DB::statement 
            // 2. or change type to string
            // We'll use string for better flexibility in Phase 1
            $table->string('status')->default('draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->renameColumn('po_jo_id', 'purchase_order_id');
            $table->dropForeign(['accounting_validated_by']);
            $table->dropColumn(['accounting_validated_by', 'accounting_validated_at']);
        });
    }
};
