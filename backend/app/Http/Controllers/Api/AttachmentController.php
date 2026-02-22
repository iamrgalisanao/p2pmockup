<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentController extends Controller
{
    /**
     * GET /api/requisitions/{requisition}/attachments
     */
    public function index(Requisition $requisition)
    {
        return response()->json($requisition->attachments()->with('uploadedBy')->get());
    }

    /**
     * POST /api/requisitions/{requisition}/attachments
     */
    public function store(Request $request, Requisition $requisition)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB
            'doc_type' => 'required|string',
            'entity_type' => 'required|in:requisition,quote,po,jo,nta',
            'entity_id' => 'required|string',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $path = "attachments/" . date('Y/m') . "/" . Str::uuid() . "." . $file->getClientOriginalExtension();

        // Upload to S3 (or configured disk)
        Storage::disk('s3')->put($path, file_get_contents($file));

        $attachment = Attachment::create([
            'entity_type' => $request->entity_type,
            'entity_id' => $request->entity_id,
            'doc_type' => $request->doc_type,
            'original_filename' => $originalName,
            'storage_key' => $path,
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json($attachment, 201);
    }

    /**
     * GET /api/attachments/{attachment}/url
     */
    public function presignedUrl(Attachment $attachment)
    {
        return response()->json([
            'url' => $attachment->presignedUrl(3600) // 1 hour expiry
        ]);
    }

    public function destroy(Attachment $attachment)
    {
        Storage::disk('s3')->delete($attachment->storage_key);
        $attachment->delete();
        return response()->json(['message' => 'Attachment deleted.']);
    }
}
