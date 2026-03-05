<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function authorizeAdminOrPresident()
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['admin', 'president'])) {
            abort(403, 'Unauthorized action. Only administrators can manage users.');
        }
    }

    public function index()
    {
        $this->authorizeAdminOrPresident();
        return response()->json(User::with(['department', 'supervisor'])->orderBy('name')->get());
    }

    public function searchDeptHeads(Request $request)
    {
        $query = $request->input('q', '');

        $users = User::with('department')
            ->where('role', 'dept_head');

        if (!empty($query)) {
            $users->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', '%' . $query . '%')
                    ->orWhereHas('department', function ($q2) use ($query) {
                        $q2->where('name', 'LIKE', '%' . $query . '%');
                    });
            });
        }

        // Limit results to 20 for performance
        return response()->json($users->orderBy('name')->take(20)->get());
    }

    public function store(Request $request)
    {
        $this->authorizeAdminOrPresident();
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:requester,dept_head,proc_officer,finance_reviewer,president,accounting_staff,accounting_supervisor,accounting_manager,admin',
            'department_id' => 'required|exists:departments,id',
            'supervisor_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ]);

        $data = $request->all();
        $data['password'] = Hash::make($data['password']);

        return response()->json(User::create($data), 201);
    }

    public function show(User $user)
    {
        $this->authorizeAdminOrPresident();
        return response()->json($user->load(['department', 'requisitions']));
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeAdminOrPresident();
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:requester,dept_head,proc_officer,finance_reviewer,president,accounting_staff,accounting_supervisor,accounting_manager,admin',
            'department_id' => 'sometimes|exists:departments,id',
            'supervisor_id' => 'nullable|exists:users,id',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->update($request->except('password'));

        return response()->json($user->load(['department', 'supervisor']));
    }

    public function destroy(User $user)
    {
        $this->authorizeAdminOrPresident();

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $user->delete();
        return response()->json(null, 204);
    }
}
