<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            // Immutable append-only table — NO updated_at, NO soft deletes
            $table->char('id', 36)->primary();
            $table->string('entity_type'); // requisition | quote | approval_step | etc.
            $table->char('entity_id', 36);
            $table->string('action');      // status_changed | approved | document_generated | etc.
            $table->char('actor_id', 36)->nullable();
            $table->string('actor_role')->nullable();
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('created_at'); // Only created_at — this record is never updated

            $table->index(['entity_type', 'entity_id', 'created_at']);
            $table->index('actor_id');
        });
        // Note: Grant only INSERT privilege to app DB user for this table in production
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
