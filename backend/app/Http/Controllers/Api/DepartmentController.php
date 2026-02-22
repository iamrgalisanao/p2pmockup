<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::with('parent')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:department,project',
            'parent_id' => 'nullable|exists:departments,id',
            'budget_limit' => 'nullable|numeric|min:0',
        ]);

        return response()->json(Department::create($request->all()), 201);
    }

    public function show(Department $department)
    {
        return response()->json($department->load(['children', 'users']));
    }

    public function update(Request $request, Department $department)
    {
        $department->update($request->all());
        return response()->json($department);
    }
}
