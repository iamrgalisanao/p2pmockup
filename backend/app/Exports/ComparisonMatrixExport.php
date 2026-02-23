<?php

namespace App\Exports;

use App\Models\Requisition;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ComparisonMatrixExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected $requisition;
    protected $quotes;
    protected $prItems;

    public function __construct(Requisition $requisition)
    {
        $this->requisition = $requisition;
        $this->prItems = $requisition->lineItems;
        $this->quotes = $requisition->quotes()->with('vendor', 'lineItems')->get();
    }

    public function collection()
    {
        return $this->prItems;
    }

    public function headings(): array
    {
        $headers = [
            '#',
            'Description',
            'Qty',
            'Unit'
        ];

        foreach ($this->quotes as $quote) {
            $headers[] = $quote->vendor->name . ' (Unit Price)';
            $headers[] = $quote->vendor->name . ' (Total)';
        }

        return $headers;
    }

    public function map($prItem): array
    {
        static $index = 0;
        $index++;

        $row = [
            $index,
            $prItem->description,
            $prItem->quantity,
            $prItem->unit
        ];

        foreach ($this->quotes as $quote) {
            $quoteItem = $quote->lineItems->firstWhere('requisition_line_item_id', $prItem->id);
            $row[] = $quoteItem ? number_format($quoteItem->unit_price, 2, '.', '') : '-';
            $row[] = $quoteItem ? number_format($quoteItem->line_total, 2, '.', '') : '-';
        }

        return $row;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
