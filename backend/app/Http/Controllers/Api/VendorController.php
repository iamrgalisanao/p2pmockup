<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    private function authorizeManageVendors()
    {
        $role = auth()->user()->role;
        if ($role !== 'admin' && $role !== 'proc_officer') {
            abort(403, 'Unauthorized action. Only Procurement Officers or Admins can manage vendors.');
        }
    }

    public function index()
    {
        return response()->json(Vendor::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $this->authorizeManageVendors();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'accreditation_status' => 'required|in:active,suspended,blacklisted',
        ]);

        return response()->json(Vendor::create($request->all()), 201);
    }

    public function show(Vendor $vendor)
    {
        return response()->json($vendor->load('quotes.requisition'));
    }

    public function update(Request $request, Vendor $vendor)
    {
        $this->authorizeManageVendors();
        $vendor->update($request->all());
        return response()->json($vendor);
    }

    public function destroy(Vendor $vendor)
    {
        $this->authorizeManageVendors();
        if ($vendor->quotes()->count() > 0) {
            return response()->json(['message' => 'Cannot delete vendor with existing quotes.'], 422);
        }
        $vendor->delete();
        return response()->json(null, 204);
    }
}
