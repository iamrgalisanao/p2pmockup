<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\BudgetLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetController extends Controller
{
    /**
     * GET /api/budget
     * Returns summary of all budget lines.
     */
    public function index(Request $request)
    {
        $type = $request->query('type', 'department'); // department (OPEX) or project (CAPEX)

        $lines = Department::where('type', $type)
            ->where('is_active', true)
            ->get()
            ->map(function (Department $dept) {
                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'type' => $dept->type,
                    'budget_limit' => $dept->budget_limit,
                    'pre_encumbered' => $dept->getPreEncumberedAmount(),
                    'encumbered' => $dept->getEncumberedAmount(),
                    'actual_spent' => $dept->getActualSpentAmount(),
                    'available' => $dept->getAvailableBudget(),
                    'utilization_rate' => $dept->budget_limit > 0
                        ? round(($dept->budget_limit - $dept->getAvailableBudget()) / $dept->budget_limit * 100, 2)
                        : 0
                ];
            });

        return response()->json($lines);
    }

    /**
     * GET /api/budget/{department}
     * Returns detailed ledger for a specific budget line.
     */
    public function show(Department $department)
    {
        $summary = [
            'id' => $department->id,
            'name' => $department->name,
            'budget_limit' => $department->budget_limit,
            'pre_encumbered' => $department->getPreEncumberedAmount(),
            'encumbered' => $department->getEncumberedAmount(),
            'actual_spent' => $department->getActualSpentAmount(),
            'available' => $department->getAvailableBudget(),
        ];

        $ledger = BudgetLedger::where('department_id', $department->id)
            ->with(['requisition', 'purchaseOrder', 'paymentRequest'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'summary' => $summary,
            'ledger' => $ledger
        ]);
    }

    /**
     * POST /api/budget/transfer
     * Move funds between budget lines (Adjustment).
     */
    public function transfer(Request $request)
    {
        $request->validate([
            'from_id' => 'required|exists:departments,id',
            'to_id' => 'required|exists:departments,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Remove from source
            BudgetLedger::create([
                'department_id' => $request->from_id,
                'type' => 'adjustment',
                'amount' => -$request->amount,
                'description' => "Budget Transfer Out: " . $request->reason,
            ]);

            // 2. Add to destination
            BudgetLedger::create([
                'department_id' => $request->to_id,
                'type' => 'adjustment',
                'amount' => $request->amount,
                'description' => "Budget Transfer In: " . $request->reason,
            ]);

            return response()->json(['message' => 'Budget transfer successful.']);
        });
    }
}
