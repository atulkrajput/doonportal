<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Google-only accounts have no password until the user sets one.
            $table->string('password')->nullable()->change();
            $table->string('google_id')->nullable()->unique()->after('email');

            // users.phone holds the number in E.164 (+919876543210); this is its ISO country.
            $table->string('phone_country', 2)->nullable()->after('phone');

            $table->string('address_line1')->nullable()->after('bio');
            $table->string('address_line2')->nullable()->after('address_line1');
            $table->string('city', 100)->nullable()->after('address_line2');
            $table->string('state', 100)->nullable()->after('city');
            $table->string('postal_code', 20)->nullable()->after('state');
            $table->string('country', 2)->nullable()->after('postal_code');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->text('owner_reply')->nullable()->after('body');
            $table->timestamp('owner_replied_at')->nullable()->after('owner_reply');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['owner_reply', 'owner_replied_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_id']);
            $table->dropColumn(['google_id', 'phone_country', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country']);
        });
    }
};
