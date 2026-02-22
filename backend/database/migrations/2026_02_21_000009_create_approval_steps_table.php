<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('requisition_id', 36);
            $table->unsignedSmallInteger('step_number');
            $table->string('step_label'); // e.g. "Department Head Approval"
            $table->string('role_required'); // dept_head | proc_officer | finance_reviewer | admin
            $table->char('approver_id', 36)->nullable();
            $table->enum('action', ['pending', 'approved', 'rejected', 'returned', 'on_hold'])->default('pending');
            $table->text('comment')->nullable(); // Required for rejected|returned|on_hold
            $table->timestamp('actioned_at')->nullable();
            $table->timestamp('sla_deadline')->nullable();
            $table->boolean('sla_paused')->default(false);
            $table->timestamp('sla_paused_at')->nullable();
            $table->timestamp('sla_resumed_at')->nullable();
            $table->unsignedInteger('version')->default(1); // Optimistic locking
            $table->timestamps();

            $table->foreign('requisition_id')->references('id')->on('requisitions')->cascadeOnDelete();
            $table->foreign('approver_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['requisition_id', 'step_number']);
            $table->index(['action', 'role_required']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
