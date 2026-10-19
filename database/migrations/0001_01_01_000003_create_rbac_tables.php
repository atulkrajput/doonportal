<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 50)->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignUlid('role_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->primary(['role_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignUlid('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
            $table->index('role_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
