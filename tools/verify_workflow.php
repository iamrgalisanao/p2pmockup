// End-to-End Workflow Verification Script

use App\Models\User;
use App\Models\Requisition;
use App\Models\Vendor;
use App\Services\RequisitionWorkflowService;
use Illuminate\Support\Facades\Auth;

try {
    echo "--- Starting Workflow Verification ---\n";
    $service = app(RequisitionWorkflowService::class);

    // 1. Setup Auth as Requester
    $requester = User::where('email', 'james@p2p.com')->first();
    Auth::login($requester);
    echo "Requester Logged In: {$requester->name}\n";

    // 2. Create Requisition
    $req = Requisition::create([
        'ref_number' => 'PR-' . date('Ymd') . '-TEST1',
        'title' => 'Test Server Racks',
        'request_type' => 'goods',
        'priority' => 'normal',
        'date_needed' => now()->addDays(14),
        'department_id' => $requester->department_id,
        'created_by' => $requester->id,
        'estimated_total' => 50000,
        'status' => 'draft',
    ]);

    $req->lineItems()->create([
        'description' => '42U Server Rack',
        'quantity' => 2,
        'unit' => 'pcs',
        'estimated_unit_cost' => 25000,
        'line_total' => 50000
    ]);
    echo "Requisition Created (Draft): {$req->ref_number}\n";

    // 3. Submit Requisition
    $service->transition($req, 'submitted');
    echo "Requisition Submitted. New Status: {$req->fresh()->status}\n";

    // 4. Act on Approval Steps (Dept Head)
    $deptHead = User::where('email', 'sarah@p2p.com')->first();
    Auth::login($deptHead);

    $step = $req->approvalSteps()->where('action', 'pending')->first();
    echo "Pending Step: {$step->step_label} for {$step->role_required}\n";

    $service->processApprovalAction($step, 'approved');
    echo "Step Approved. PR Status: {$req->fresh()->status}\n";

    // 5. Vendor Quotes (Procurement Officer)
    $procOfficer = User::where('email', 'mike@p2p.com')->first();
    Auth::login($procOfficer);

    $vendors = Vendor::take(3)->get();
    foreach ($vendors as $i => $v) {
        $quote = $req->quotes()->create([
            'vendor_id' => $v->id,
            'is_complete' => true,
            'grand_total' => 45000 + ($i * 1000)
        ]);
        $quote->lineItems()->create([
            'requisition_line_item_id' => $req->lineItems->first()->id,
            'unit_price' => 22500 + ($i * 500),
            'line_total' => 45000 + ($i * 1000)
        ]);
    }
    echo "3 Vendor Quotes Added.\n";

    // 6. Award Quote
    // Assuming status is 'approved' and we have >3 quotes. We can award directly by selecting a quote.
    $lowestQuote = $req->lowestQuote();
    echo "Lowest Quote ID: {$lowestQuote->id} - {$lowestQuote->vendor->name}\n";

    $nta = $service->awardVendor($req, $lowestQuote, ['justification' => null]);
    echo "Vendor Awarded. NTA Ref: {$nta->ref_number}\n";
    echo "Requisition Status: {$req->fresh()->status}\n";

    // 7. Mark NTA Sent
    $service->markSent($req, 'nta');
    echo "NTA marked as sent. PR Status: {$req->fresh()->status}\n";

    echo "--- Workflow Verification SUCCESS ---\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
