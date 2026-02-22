<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Requisition;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * GET /api/requisitions/{requisition}/audit
     */
    public function forRequisition(Requisition $requisition)
    {
        $logs = AuditLog::with('actor')
            ->where('entity_id', $requisition->id)
            ->where('entity_type', 'Requisition')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($logs);
    }
}
