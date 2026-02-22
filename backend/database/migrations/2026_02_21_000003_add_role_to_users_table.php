<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', [
                'requester',
                'dept_head',
                'proc_officer',
                'finance_reviewer',
                'admin',
            ])->default('requester')->after('email');
            $table->char('department_id', 36)->nullable()->after('role');
            $table->json('project_ids')->nullable()->after('department_id');
            $table->boolean('is_active')->default(true)->after('project_ids');

            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn(['role', 'department_id', 'project_ids', 'is_active']);
        });
    }
};
