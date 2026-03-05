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
            $table->string('funding_source')->nullable()->after('request_type'); // OPEX, CAPEX
            $table->json('checked_by_ids')->nullable()->after('department_id'); // For multiple dept heads
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            $table->dropColumn(['funding_source', 'checked_by_ids']);
        });
    }
};
