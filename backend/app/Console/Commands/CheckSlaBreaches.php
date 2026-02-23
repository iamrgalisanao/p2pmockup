<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ApprovalStep;
use App\Models\AuditLog;
use App\Models\User;
use App\Mail\SlaBreachNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class CheckSlaBreaches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'p2p:check-sla';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Checks for pending approval steps that have exceeded their SLA deadline.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting SLA check...');

        $breachedSteps = ApprovalStep::where('action', 'pending')
            ->where('is_sla_breached', false)
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', Carbon::now())
            ->get();

        if ($breachedSteps->isEmpty()) {
            $this->info('No new SLA breaches found.');
            return;
        }

        $this->warn("Found {$breachedSteps->count()} new SLA breaches.");

        foreach ($breachedSteps as $step) {
            /** @var ApprovalStep $step */
            $step->is_sla_breached = true;
            $step->save();

            // Record in Audit Log
            AuditLog::record($step->requisition, 'sla_breach', null, [
                'step_label' => $step->step_label,
                'role_required' => $step->role_required,
                'deadline' => $step->sla_deadline->toDateTimeString()
            ]);

            $this->line(" - PR {$step->requisition->ref_number} : {$step->step_label} (Role: {$step->role_required})");

            $approvers = User::where('role', $step->role_required)->get();
            if ($approvers->isNotEmpty()) {
                Mail::to($approvers)->send(new SlaBreachNotification($step));
            }
        }

        $this->info('SLA check completed.');
    }
}
