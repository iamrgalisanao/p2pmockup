<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('requisitions', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('ref_number')->unique(); // PR-YYYY-#####
            $table->string('title');
            $table->char('department_id', 36);
            $table->char('project_id', 36)->nullable();
            $table->char('requested_by', 36);
            $table->date('date_needed');
            $table->enum('priority', ['normal', 'urgent'])->default('normal');
            $table->text('description')->nullable();
            $table->decimal('estimated_total', 15, 4)->default(0); // SYSTEM-CALCULATED
            $table->boolean('checklist_satisfied')->default(false); // SYSTEM-CALCULATED
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
            ])->default('draft');
            $table->text('hold_reason')->nullable();
            $table->timestamp('sla_deadline')->nullable();
            $table->boolean('sla_paused')->default(false);
            $table->timestamp('sla_paused_at')->nullable();
            $table->unsignedInteger('version')->default(1); // Optimistic locking
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments');
            $table->foreign('project_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('requested_by')->references('id')->on('users');

            $table->index(['status', 'department_id']);
            $table->index('requested_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisitions');
    }
};
