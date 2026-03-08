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
            $table->string('external_sap_ref')->nullable()->after('po_number');
            $table->timestamp('sap_verified_at')->nullable()->after('external_sap_ref');
            $table->uuid('sap_verified_by')->nullable()->after('sap_verified_at');
            $table->uuid('reactivated_from_id')->nullable()->after('sap_verified_by');
            $table->uuid('superseded_by_id')->nullable()->after('reactivated_from_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('requisitions', function (Blueprint $table) {
            //
        });
    }
};
