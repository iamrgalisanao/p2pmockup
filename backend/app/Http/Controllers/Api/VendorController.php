<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index()
    {
        return response()->json(Vendor::orderBy('name')->get());
    }

    public function store(Request $request)
    {
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
        $vendor->update($request->all());
        return response()->json($vendor);
    }

    public function destroy(Vendor $vendor)
    {
        if ($vendor->quotes()->count() > 0) {
            return response()->json(['message' => 'Cannot delete vendor with existing quotes.'], 422);
        }
        $vendor->delete();
        return response()->json(null, 204);
    }
}
