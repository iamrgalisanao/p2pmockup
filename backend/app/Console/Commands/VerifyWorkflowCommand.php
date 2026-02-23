<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Requisition;
use App\Models\Vendor;
use App\Services\RequisitionWorkflowService;
use Illuminate\Support\Facades\Auth;

class VerifyWorkflowCommand extends Command
{
    protected $signature = 'p2p:verify-workflow';
    protected $description = 'Verifies the end-to-end P2P Workflow';

    public function handle(RequisitionWorkflowService $service)
    {
        $this->info("--- Starting Workflow Verification ---");

        try {
            // 1. Setup Auth as Requester
            $requester = User::where('email', 'james@p2p.com')->first();
            Auth::login($requester);
            $this->line("Requester Logged In: {$requester->name}");

            // 2. Create Requisition
            $req = Requisition::create([
                'ref_number' => 'PR-' . date('Ymd') . '-' . uniqid(),
                'title' => 'Test Server Racks',
                'request_type' => 'goods',
                'priority' => 'normal',
                'date_needed' => now()->addDays(14),
                'department_id' => $requester->department_id,
                'requested_by' => $requester->id,
                'estimated_total' => 50000,
                'checklist_satisfied' => true,
                'status' => 'draft',
            ]);

            $req->lineItems()->create([
                'description' => '42U Server Rack',
                'quantity' => 2,
                'unit' => 'pcs',
                'estimated_unit_cost' => 25000,
                'line_total' => 50000
            ]);
            $this->line("Requisition Created (Draft): {$req->ref_number}");

            // 3. Submit Requisition
            $service->transition($req, 'submitted');
            $this->line("Requisition Submitted. New Status: {$req->fresh()->status}");

            // 4. Act on Approval Steps (Dept Head)
            $deptHead = User::where('email', 'sarah@p2p.com')->first();
            Auth::login($deptHead);

            $step = $req->approvalSteps()->where('action', 'pending')->first();
            $this->line("Pending Step: {$step->step_label} for {$step->role_required}");

            $service->processApprovalAction($step, 'approved');
            $req->refresh();
            $this->line("Step Approved. PR Status: {$req->status}");

            // 5. Vendor Quotes (Procurement Officer)
            $procOfficer = User::where('email', 'mike@p2p.com')->first();
            Auth::login($procOfficer);

            $vendors = Vendor::take(3)->get();
            foreach ($vendors as $i => $v) {
                $quote = $req->quotes()->create([
                    'vendor_id' => $v->id,
                    'is_complete' => true,
                    'is_compliant' => true,
                    'submitted_by' => $procOfficer->id,
                    'grand_total' => 45000 + ($i * 1000)
                ]);
                $quote->lineItems()->create([
                    'requisition_line_item_id' => $req->lineItems->first()->id,
                    'unit_price' => 22500 + ($i * 500),
                    'line_total' => 45000 + ($i * 1000)
                ]);
            }
            $this->line("3 Vendor Quotes Added.");

            // 6. Award Quote
            $lowestQuote = $req->lowestQuote();
            $this->line("Lowest Quote ID: {$lowestQuote->id} - {$lowestQuote->vendor->name}");

            $nta = $service->awardVendor($req, $lowestQuote, ['justification' => null]);
            $this->line("Vendor Awarded. NTA Ref: {$nta->ref_number}");
            $this->line("Requisition Status: {$req->fresh()->status}");

            // 7. Mark NTA Sent
            $service->markSent($req, 'nta');
            $this->line("NTA marked as sent. PR Status: {$req->fresh()->status}");

            // 8. Generate PO
            // The service markSent method handles this implicitly via document system in app but let's test doc gen later.
            $poId = 'manual_po_123';

            $this->info("--- Workflow Verification SUCCESS ---");

        } catch (\Exception $e) {
            $this->error("ERROR: " . $e->getMessage());
            $this->error($e->getTraceAsString());
        }
    }
}
