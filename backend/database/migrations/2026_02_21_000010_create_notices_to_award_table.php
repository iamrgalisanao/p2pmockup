<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notices_to_award', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('ref_number')->unique(); // NTA-YYYY-#####
            $table->char('requisition_id', 36)->unique(); // One NTA per requisition
            $table->char('vendor_id', 36);
            $table->char('awarded_quote_id', 36);
            $table->enum('award_basis', ['lowest_responsive_bid', 'authorized_override']);
            $table->text('override_justification')->nullable();
            $table->char('override_authorized_by', 36)->nullable();
            $table->char('issued_by', 36);
            $table->timestamp('issued_at')->nullable();
            $table->string('pdf_storage_key')->nullable();
            $table->enum('status', ['draft', 'issued', 'mark_sent'])->default('draft');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->foreign('requisition_id')->references('id')->on('requisitions');
            $table->foreign('vendor_id')->references('id')->on('vendors');
            $table->foreign('awarded_quote_id')->references('id')->on('vendor_quotes');
            $table->foreign('issued_by')->references('id')->on('users');
            $table->foreign('override_authorized_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notices_to_award');
    }
};
