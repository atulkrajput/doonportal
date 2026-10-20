<?php

namespace Tests\Feature\Admin;

use App\Models\Admin;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The admins migration moves existing staff (users holding staff roles) to
 * staff accounts with the same id, so history keeps pointing at them.
 */
class StaffMigrationTest extends AdminTestCase
{
    public function test_existing_staff_users_become_staff_accounts(): void
    {
        Artisan::call('migrate:rollback', ['--path' => 'database/migrations/2026_10_22_100000_create_admins_table.php', '--force' => true]);

        $roles = DB::table('roles')->pluck('id', 'name');
        $staffId = (string) Str::ulid();
        $memberId = (string) Str::ulid();
        foreach ([[$staffId, 'editor@example.com'], [$memberId, 'member@example.com']] as [$id, $email]) {
            DB::table('users')->insert(['id' => $id, 'name' => $email, 'email' => $email, 'password' => bcrypt('x-password-123'), 'created_at' => now(), 'updated_at' => now()]);
            DB::table('role_user')->insert(['role_id' => $roles['USER'], 'user_id' => $id, 'created_at' => now()]);
        }
        DB::table('role_user')->insert(['role_id' => $roles['EDITOR'], 'user_id' => $staffId, 'created_at' => now()]);
        DB::table('stories')->insert(['id' => (string) Str::ulid(), 'type' => 'GUIDE', 'title' => 'T', 'slug' => 't', 'status' => 'DRAFT', 'author_id' => $staffId, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('audit_logs')->insert([
            ['id' => (string) Str::ulid(), 'actor_id' => $staffId, 'action' => 'story.created', 'created_at' => now()],
            ['id' => (string) Str::ulid(), 'actor_id' => $memberId, 'action' => 'review.submitted', 'created_at' => now()],
        ]);

        Artisan::call('migrate', ['--force' => true]);

        $admin = Admin::findOrFail($staffId);
        $this->assertSame('editor@example.com', $admin->email);
        $this->assertSame(['EDITOR'], $admin->roles()->pluck('name')->all());
        $this->assertSame(['USER'], DB::table('role_user')->where('user_id', $staffId)->join('roles', 'roles.id', '=', 'role_id')->pluck('name')->all());
        $this->assertNull(Admin::find($memberId));
        $this->assertSame($staffId, DB::table('stories')->value('author_id'));
        $this->assertSame('admin', DB::table('audit_logs')->where('action', 'story.created')->value('actor_type'));
        $this->assertSame('user', DB::table('audit_logs')->where('action', 'review.submitted')->value('actor_type'));
    }
}
