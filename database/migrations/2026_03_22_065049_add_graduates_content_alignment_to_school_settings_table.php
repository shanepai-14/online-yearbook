<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('school_settings', 'graduates_content_alignment')) {
            Schema::table('school_settings', function (Blueprint $table) {
                $table->string('graduates_content_alignment', 10)->default('left');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('school_settings', 'graduates_content_alignment')) {
            Schema::table('school_settings', function (Blueprint $table) {
                $table->dropColumn('graduates_content_alignment');
            });
        }
    }
};
