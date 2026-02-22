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
        $ops = Department::create(['name' => 'Operations & Logistics', 'type' => 'department']);
        $ops->update(['code' => 'OPS-01']);

        $hr = Department::create(['name' => 'Human Resources', 'type' => 'department']);
        $it = Department::create(['name' => 'IT Infrastructure', 'type' => 'department']);

        // Projects
        $prjA = Department::create(['name' => 'Riverdale Bridge Construction', 'type' => 'project', 'parent_id' => $ops->id]);
        $prjB = Department::create(['name' => 'Solar Farm Phase 2', 'type' => 'project', 'parent_id' => $ops->id]);

        // 2. Create Users for all roles
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'James Requester',
            'email' => 'james@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'requester',
            'department_id' => $ops->id,
            'project_ids' => [$prjA->id],
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Sarah Dept Head',
            'email' => 'sarah@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'dept_head',
            'department_id' => $ops->id,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Mike Proc Officer',
            'email' => 'mike@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'proc_officer',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Elena Finance',
            'email' => 'elena@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'finance_reviewer',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        // CRIS-Specific Roles from User Guide
        User::create([
            'name' => 'John President',
            'email' => 'president@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'president',
            'department_id' => $ops->id,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Alice Accounting',
            'email' => 'accounting@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'accounting_staff',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Bob Supervisor',
            'email' => 'supervisor@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'accounting_supervisor',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Charlie Manager',
            'email' => 'manager@p2p.com',
            'password' => Hash::make('password'),
            'role' => 'accounting_manager',
            'department_id' => $it->id,
            'is_active' => true,
        ]);

        // 3. Create Sample Vendors
        Vendor::create(['name' => 'Global Industrial Supplies', 'contact_person' => 'Robert Fox', 'email' => 'robert@global.com', 'accreditation_status' => 'active']);
        Vendor::create(['name' => 'BuildRight Corp', 'contact_person' => 'Jane Smith', 'email' => 'jane@buildright.com', 'accreditation_status' => 'active']);
        Vendor::create(['name' => 'SafePath Safety Gear', 'contact_person' => 'Bill Johnson', 'email' => 'bill@safepath.com', 'accreditation_status' => 'active']);
        Vendor::create(['name' => 'Prime Hardware', 'accreditation_status' => 'suspended']);
    }
}
