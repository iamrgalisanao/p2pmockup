<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Core Departments
        $ops = Department::updateOrCreate(['name' => 'Operations & Logistics'], ['type' => 'department', 'code' => 'OPS-01']);

        $hr = Department::updateOrCreate(['name' => 'Human Resources'], ['type' => 'department']);
        $it = Department::updateOrCreate(['name' => 'IT Infrastructure'], ['type' => 'department']);

        // Projects
        $prjA = Department::updateOrCreate(['name' => 'Riverdale Bridge Construction'], [
            'type' => 'project',
            'parent_id' => $ops->id
        ]);
        $prjB = Department::updateOrCreate(['name' => 'Solar Farm Phase 2'], [
            'type' => 'project',
            'parent_id' => $ops->id
        ]);

        // 2. Create Users for all roles
        User::updateOrCreate(['email' => 'admin@p2p.com'], [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'james@p2p.com'], [
            'name' => 'James Requester',
            'password' => Hash::make('password'),
            'role' => 'requester',
            'department_id' => $ops->id,
            'project_ids' => [$prjA->id],
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'sarah@p2p.com'], [
            'name' => 'Sarah Dept Head',
            'password' => Hash::make('password'),
            'role' => 'dept_head',
            'department_id' => $ops->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'mike@p2p.com'], [
            'name' => 'Mike Proc Officer',
            'password' => Hash::make('password'),
            'role' => 'proc_officer',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'elena@p2p.com'], [
            'name' => 'Elena Finance',
            'password' => Hash::make('password'),
            'role' => 'finance_reviewer',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        // CRIS-Specific Roles from User Guide
        User::updateOrCreate(['email' => 'president@p2p.com'], [
            'name' => 'John President',
            'password' => Hash::make('password'),
            'role' => 'president',
            'department_id' => $ops->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'accounting@p2p.com'], [
            'name' => 'Alice Accounting',
            'password' => Hash::make('password'),
            'role' => 'accounting_staff',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'supervisor@p2p.com'], [
            'name' => 'Bob Supervisor',
            'password' => Hash::make('password'),
            'role' => 'accounting_supervisor',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::updateOrCreate(['email' => 'manager@p2p.com'], [
            'name' => 'Charlie Manager',
            'password' => Hash::make('password'),
            'role' => 'accounting_manager',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        // 3. Create Sample Vendors
        Vendor::updateOrCreate(['email' => 'robert@global.com'], ['name' => 'Global Industrial Supplies', 'contact_person' => 'Robert Fox', 'accreditation_status' => 'active']);
        Vendor::updateOrCreate(['email' => 'jane@buildright.com'], ['name' => 'BuildRight Corp', 'contact_person' => 'Jane Smith', 'accreditation_status' => 'active']);
        Vendor::updateOrCreate(['email' => 'bill@safepath.com'], ['name' => 'SafePath Safety Gear', 'contact_person' => 'Bill Johnson', 'accreditation_status' => 'active']);
        Vendor::updateOrCreate(['name' => 'Prime Hardware'], ['accreditation_status' => 'suspended']);
    }
}
