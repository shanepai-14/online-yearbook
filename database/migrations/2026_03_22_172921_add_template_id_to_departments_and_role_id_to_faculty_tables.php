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
        Schema::table('departments', function (Blueprint $table) {
            $table->foreignId('department_template_id')
                ->nullable()
                ->after('yearbook_id')
                ->constrained('department_templates')
                ->nullOnDelete();
        });

        Schema::table('faculty', function (Blueprint $table) {
            $table->foreignId('faculty_role_id')
                ->nullable()
                ->after('department_id')
                ->constrained('faculty_roles')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faculty', function (Blueprint $table) {
            $table->dropConstrainedForeignId('faculty_role_id');
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_template_id');
        });
    }
};
