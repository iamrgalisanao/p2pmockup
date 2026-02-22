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
        Schema::table('requisitions', function (Blueprint $table) {
            $table->string('request_type')->default('po_item')->after('ref_number');
            $table->string('cost_center')->nullable()->after('department_id');
            $table->string('po_number')->nullable()->after('request_type');
            $table->string('particulars')->nullable()->after('title');
        });

        Schema::table('requisition_line_items', function (Blueprint $table) {
            $table->string('gl_account_code')->nullable()->after('description');
            $table->string('account_name')->nullable()->after('gl_account_code');
            $table->string('gl_category')->nullable()->after('account_name');
            $table->string('budget_line_item')->nullable()->after('gl_category');
            $table->string('vat_type')->nullable()->after('budget_line_item');
            $table->string('wht_type')->nullable()->after('vat_type');
            $table->decimal('gross_price', 15, 2)->nullable()->after('estimated_unit_cost');
            $table->decimal('net_price', 15, 2)->nullable()->after('gross_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropColumn(['request_type', 'cost_center', 'po_number', 'particulars']);
        });

        Schema::table('requisition_line_items', function (Blueprint $table) {
            $table->dropColumn([
                'gl_account_code',
                'account_name',
                'gl_category',
                'budget_line_item',
                'vat_type',
                'wht_type',
                'gross_price',
                'net_price'
            ]);
        });
    }
};
