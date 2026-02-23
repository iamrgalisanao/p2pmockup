<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_line_items', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('payment_request_id', 36);
            $table->string('description');
            $table->string('gl_account_code')->nullable();
            $table->string('gl_category')->nullable();
            $table->decimal('quantity', 15, 4)->default(1);
            $table->decimal('unit_cost', 15, 2);
            $table->string('vat_type')->nullable();
            $table->string('wht_type')->nullable();
            $table->decimal('gross_price', 15, 2)->nullable();
            $table->decimal('net_price', 15, 2)->nullable();
            $table->decimal('line_total', 15, 2);
            $table->timestamps();

            $table->foreign('payment_request_id')->references('id')->on('payment_requests')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_line_items');
    }
};
