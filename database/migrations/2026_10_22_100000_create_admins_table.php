<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Staff (DoonPortal team) accounts live in their own table with their own
 * sign-in, separate from members. Staff roles move from role_user to
 * admin_role, and columns that record a staff action point at admins.
 */
return new class extends Migration
{
    private const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR'];

    /** table => column recording which staff member did something. */
    private const STAFF_COLUMNS = [
        'business_claims' => 'reviewer_id',
        'submissions' => 'reviewer_id',
        'reviews' => 'moderated_by',
        'reports' => 'resolver_id',
        'stories' => 'author_id',
        'collections' => 'curator_id',
        'media' => 'uploaded_by',
        'settings' => 'updated_by',
        'seo_meta' => 'updated_by',
        'subscriptions' => 'created_by',
        'pages' => 'updated_by',
    ];

    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('admin_role', function (Blueprint $table) {
            $table->foreignUlid('role_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('admin_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->primary(['role_id', 'admin_id']);
            $table->index('admin_id');
        });

        $this->moveExistingStaff();

        foreach (self::STAFF_COLUMNS as $table => $column) {
            Schema::table($table, fn (Blueprint $t) => $t->dropForeign([$column]));
            DB::table($table)->whereNotNull($column)->whereNotIn($column, DB::table('admins')->select('id'))->update([$column => null]);
            Schema::table($table, fn (Blueprint $t) => $t->foreign($column)->references('id')->on('admins')->nullOnDelete());
        }

        // The audit trail records both staff and members, so the actor becomes polymorphic.
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['actor_id']);
        });
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('actor_type', 30)->nullable()->after('id');
            $table->index(['actor_type', 'actor_id']);
        });
        DB::table('audit_logs')->whereIn('actor_id', DB::table('admins')->select('id'))->update(['actor_type' => 'admin']);
        DB::table('audit_logs')->whereNotNull('actor_id')->whereNull('actor_type')->update(['actor_type' => 'user']);
    }

    /**
     * Users holding a staff role get a staff account with the same id (so past
     * records still point at them) and lose the staff role on their member account.
     */
    private function moveExistingStaff(): void
    {
        $staffRoleIds = DB::table('roles')->whereIn('name', self::STAFF_ROLES)->pluck('id');
        if ($staffRoleIds->isEmpty()) {
            return;
        }

        $links = DB::table('role_user')->whereIn('role_id', $staffRoleIds)->get();

        DB::table('users')->whereIn('id', $links->pluck('user_id')->unique())->get()->each(function ($user) {
            DB::table('admins')->insert([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                // Google-only members have no password; a super admin sets one for them.
                'password' => $user->password ?: Hash::make(Str::random(64)),
                'is_active' => $user->deleted_at === null,
                'remember_token' => null,
                'created_at' => $user->created_at,
                'updated_at' => now(),
                'deleted_at' => $user->deleted_at,
            ]);
        });

        $links->each(fn ($link) => DB::table('admin_role')->insert([
            'role_id' => $link->role_id,
            'admin_id' => $link->user_id,
            'created_at' => $link->created_at,
        ]));

        DB::table('role_user')->whereIn('role_id', $staffRoleIds)->delete();
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['actor_type', 'actor_id']);
            $table->dropColumn('actor_type');
        });
        DB::table('audit_logs')->whereNotNull('actor_id')->whereNotIn('actor_id', DB::table('users')->select('id'))->update(['actor_id' => null]);
        Schema::table('audit_logs', fn (Blueprint $t) => $t->foreign('actor_id')->references('id')->on('users')->nullOnDelete());

        foreach (self::STAFF_COLUMNS as $table => $column) {
            Schema::table($table, fn (Blueprint $t) => $t->dropForeign([$column]));
            DB::table($table)->whereNotNull($column)->whereNotIn($column, DB::table('users')->select('id'))->update([$column => null]);
            Schema::table($table, fn (Blueprint $t) => $t->foreign($column)->references('id')->on('users')->nullOnDelete());
        }

        // Staff roles go back to the member accounts that share the id, where one exists.
        $userIds = DB::table('users')->pluck('id')->flip();
        DB::table('admin_role')->get()->each(function ($link) use ($userIds) {
            if ($userIds->has($link->admin_id)) {
                DB::table('role_user')->insertOrIgnore(['role_id' => $link->role_id, 'user_id' => $link->admin_id, 'created_at' => $link->created_at]);
            }
        });

        Schema::dropIfExists('admin_role');
        Schema::dropIfExists('admins');
    }
};
