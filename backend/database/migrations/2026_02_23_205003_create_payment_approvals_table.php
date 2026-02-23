<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_approvals', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('payment_request_id', 36);
            $table->unsignedInteger('step_number');
            $table->string('step_label');
            $table->string('role_required');
            $table->char('actioned_by', 36)->nullable();
            $table->enum('action', ['pending', 'approved', 'rejected', 'returned', 'on_hold', 'cancelled'])->default('pending');
            $table->text('comment')->nullable();
            $table->timestamp('actioned_at')->nullable();
            $table->timestamp('sla_deadline')->nullable();
            $table->boolean('is_sla_breached')->default(false);
            $table->timestamps();

            $table->foreign('payment_request_id')->references('id')->on('payment_requests')->onDelete('cascade');
            $table->foreign('actioned_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['payment_request_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_approvals');
    }
};
