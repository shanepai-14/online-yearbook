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
        if (Schema::hasColumn('yearbooks', 'school_name')) {
            Schema::table('yearbooks', function (Blueprint $table) {
                $table->dropColumn('school_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('yearbooks', 'school_name')) {
            Schema::table('yearbooks', function (Blueprint $table) {
                $table->string('school_name')->default('School');
            });
        }
    }
};
