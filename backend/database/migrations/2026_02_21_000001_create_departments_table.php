<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('name');
            $table->string('code')->nullable()->unique();
            $table->enum('type', ['department', 'project'])->default('department');
            $table->char('parent_id', 36)->nullable();
            $table->decimal('budget_limit', 15, 4)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('departments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
