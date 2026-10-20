<?php

namespace App\Console\Commands;

use App\Enums\RoleName;
use App\Models\Admin;
use App\Services\AuditLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Create a DoonPortal staff account from the server, e.g. the first super
 * admin. Later staff can be added from Admin > Staff.
 */
class CreateStaff extends Command
{
    protected $signature = 'staff:create
        {--name= : Full name}
        {--email= : Sign-in email}
        {--role=SUPER_ADMIN : SUPER_ADMIN, ADMIN, EDITOR or MODERATOR}';

    protected $description = 'Create a staff account for the DoonPortal admin area';

    public function handle(AuditLogger $audit): int
    {
        $name = $this->option('name') ?: $this->ask('Full name');
        $email = strtolower(trim((string) ($this->option('email') ?: $this->ask('Email'))));
        $role = strtoupper((string) $this->option('role'));
        // Never accepted as an option, so it stays out of shell history.
        $password = $this->secret('Password (at least 8 characters)');
        $confirm = $this->secret('Repeat the password');

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'role' => $role, 'password' => $password, 'password_confirmation' => $confirm],
            [
                'name' => ['required', 'string', 'max:120'],
                'email' => ['required', 'email', 'max:255', Rule::unique('admins', 'email')],
                'role' => ['required', Rule::in(RoleName::staffValues())],
                'password' => ['required', 'string', 'confirmed', Password::defaults()],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $admin = DB::transaction(function () use ($name, $email, $password, $role, $audit) {
            $admin = Admin::create(['name' => $name, 'email' => $email, 'password' => $password]);
            $admin->assignRole(RoleName::from($role));
            $audit->log('admin.created', $admin, null, ['name' => $name, 'email' => $email, 'roles' => [$role], 'via' => 'console']);

            return $admin;
        });

        $this->info("Created {$role} {$admin->email}. Sign in at ".url('/admin/login'));

        return self::SUCCESS;
    }
}
