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
            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'for_quoting',
                'quote_evaluation',
                'for_approval',
                'approved',
                'rejected',
                'on_hold',
                'returned',
                'awarded',
                'po_issued',
                'closed',
                'cancelled',
            ])->default('draft')->change();
        });
    }

    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'for_quoting',
                'quote_evaluation',
                'for_approval',
                'approved',
                'rejected',
                'on_hold',
                'awarded',
                'po_issued',
                'closed',
                'cancelled',
            ])->default('draft')->change();
        });
    }
};
