<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Editable site pages (privacy policy, terms, about, contact…). Bodies are sanitized HTML
        // and may contain {{tokens}} filled from the "legal" settings group at render time.
        Schema::create('pages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title');
            $table->string('summary', 320)->nullable();
            $table->longText('body')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->boolean('show_in_footer')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->foreignUlid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
