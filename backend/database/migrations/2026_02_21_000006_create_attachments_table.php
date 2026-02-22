<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('entity_type'); // requisition | quote | po | jo | nta
            $table->char('entity_id', 36);
            $table->string('doc_type'); // purchase_request_form | canvass_sheet | etc.
            $table->string('original_filename');
            $table->string('storage_key'); // S3 object key
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->char('uploaded_by', 36);
            $table->timestamps();

            $table->foreign('uploaded_by')->references('id')->on('users');
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
