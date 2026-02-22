<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('department')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:requester,dept_head,proc_officer,finance_reviewer,admin',
            'department_id' => 'required|exists:departments,id',
            'is_active' => 'boolean',
        ]);

        $data = $request->all();
        $data['password'] = Hash::make($data['password']);

        return response()->json(User::create($data), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load(['department', 'requisitions']));
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:requester,dept_head,proc_officer,finance_reviewer,admin',
            'department_id' => 'sometimes|exists:departments,id',
        ]);

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->update($request->except('password'));

        return response()->json($user);
    }
}
