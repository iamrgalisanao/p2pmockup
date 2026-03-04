<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Department;
use App\Models\Requisition;
use App\Models\BudgetLedger;
use App\Services\BudgetService;

class BudgetMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $dept;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->dept = Department::factory()->create([
            'name' => 'IT Department',
            'budget_limit' => 100000.00,
            'type' => 'department',
            'is_active' => true
        ]);
    }

    public function test_pr_submission_creates_pre_encumbrance()
    {
        $requisition = Requisition::create([
            'title' => 'Test Budget PR',
            'department_id' => $this->dept->id,
            'requested_by' => $this->admin->id,
            'estimated_total' => 5000.00,
            'status' => 'draft'
        ]);

        $budgetService = new BudgetService();
        $budgetService->preEncumber($requisition);

        $this->assertEquals(5000.00, $this->dept->getPreEncumberedAmount());
        $this->assertEquals(95000.00, $this->dept->getAvailableBudget());

        $this->assertDatabaseHas('budget_ledgers', [
            'department_id' => $this->dept->id,
            'type' => 'pre_encumbrance',
            'amount' => 5000.00,
            'requisition_id' => $requisition->id
        ]);
    }

    public function test_budget_hard_stop_at_controller()
    {
        $this->dept->update(['budget_limit' => 1000.00]);

        $requisition = Requisition::create([
            'title' => 'Expensive PR',
            'department_id' => $this->dept->id,
            'requested_by' => $this->admin->id,
            'estimated_total' => 2000.00,
            'status' => 'draft',
            'checklist_satisfied' => true
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/requisitions/{$requisition->id}/submit");

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Insufficient budget for this requisition.']);
    }
}
