<?php

namespace App\Exports;

use App\Models\Requisition;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RequisitionExport implements FromCollection, WithHeadings, WithMapping
{
    protected $userId;
    protected $role;
    protected $requisitionId;

    public function __construct($userId, $role, $requisitionId = null)
    {
        $this->userId = $userId;
        $this->role = $role;
        $this->requisitionId = $requisitionId;
    }

    public function collection()
    {
        $query = Requisition::with(['department', 'requester', 'lineItems'])
            ->orderByDesc('created_at');

        if ($this->requisitionId) {
            $query->where('id', $this->requisitionId);
        } elseif ($this->role !== 'admin' && $this->role !== 'proc_officer') {
            $query->where('requested_by', $this->userId);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'Ref Number',
            'Title',
            'Department',
            'Requester',
            'Date Needed',
            'Priority',
            'Status',
            'Estimated Total',
            'Grand Total (PO)',
            'Created At',
        ];
    }

    public function map($r): array
    {
        return [
            $r->ref_number,
            $r->title,
            $r->department->name,
            $r->requester->name,
            $r->date_needed->format('Y-m-d'),
            strtoupper($r->priority),
            $r->status,
            number_format($r->estimated_total, 2, '.', ''),
            $r->purchaseOrder ? number_format($r->purchaseOrder->grand_total, 2, '.', '') : '0.00',
            $r->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
