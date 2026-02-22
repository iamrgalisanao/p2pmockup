<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RequisitionController;
use App\Http\Controllers\Api\RequisitionLineItemController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\VendorQuoteController;
use App\Http\Controllers\Api\QuoteLineItemController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ReportController;

// ──────────────────────────────────────────────────
// Public Routes
// ──────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// ──────────────────────────────────────────────────
// Protected Routes (Laravel Sanctum)
// ──────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'App\Http\Middleware\EnsureUserIsActive'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Dashboard & Inbox
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/inbox', [DashboardController::class, 'inbox']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Departments
    Route::apiResource('departments', DepartmentController::class);

    // Users (admin only)
    Route::apiResource('users', UserController::class);

    // Vendors
    Route::apiResource('vendors', VendorController::class);

    // Requisitions
    Route::apiResource('requisitions', RequisitionController::class);
    Route::prefix('requisitions/{requisition}')->group(function () {
        Route::post('/submit', [RequisitionController::class, 'submit']);
        Route::post('/cancel', [RequisitionController::class, 'cancel']);
        Route::get('/audit', [AuditLogController::class, 'forRequisition']);

        // Line Items
        Route::apiResource('line-items', RequisitionLineItemController::class)
            ->except(['index', 'show']);

        // Attachments
        Route::get('/attachments', [AttachmentController::class, 'index']);
        Route::post('/attachments', [AttachmentController::class, 'store']);
        Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy']);

        // Vendor Quotes
        Route::apiResource('quotes', VendorQuoteController::class)
            ->except(['index']);
        Route::get('/quotes', [VendorQuoteController::class, 'index']);
        Route::post('/quotes/{quote}/award', [VendorQuoteController::class, 'award']);

        // Quote Line Items
        Route::put('/quotes/{quote}/line-items', [QuoteLineItemController::class, 'bulkUpdate']);

        // Approval
        Route::get('/approval-steps', [ApprovalController::class, 'index']);
        Route::post('/approval-steps/{step}/act', [ApprovalController::class, 'act']);

        // Document Generation
        Route::post('/documents/generate', [DocumentController::class, 'generate']);
        Route::post('/documents/mark-sent', [DocumentController::class, 'markSent']);
        Route::get('/documents/view', [DocumentController::class, 'view']);
        Route::get('/documents', [DocumentController::class, 'index']);
    });

    // Attachments — presigned URL
    Route::get('/attachments/{attachment}/url', [AttachmentController::class, 'presignedUrl']);

    // Reports & Exports
    Route::prefix('reports')->group(function () {
        Route::get('/export', [ReportController::class, 'export']);
        Route::get('/requisitions/{requisition}/export', [ReportController::class, 'exportSingle']);
        Route::get('/sla-breaches', [ReportController::class, 'slaBreaches']);
        Route::get('/cost-comparison/{requisition}', [ReportController::class, 'costComparison']);
    });
});
