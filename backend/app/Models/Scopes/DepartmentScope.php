<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class DepartmentScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $user = Auth::user();
        if (!$user) {
            return;
        }

        // Global roles can see everything
        $globalRoles = [
            'admin',
            'proc_officer',
            'finance_reviewer',
            'president',
            'accounting_staff',
            'accounting_supervisor',
            'accounting_manager'
        ];

        if (in_array($user->role, $globalRoles)) {
            return;
        }

        // Filter by department, requester, or assigned projects
        $builder->where(function ($query) use ($user) {
            $query->where('department_id', $user->department_id)
                ->orWhere('requested_by', $user->id);

            if ($user->project_ids && is_array($user->project_ids)) {
                $query->orWhereIn('project_id', $user->project_ids);
            }
        });
    }
}
