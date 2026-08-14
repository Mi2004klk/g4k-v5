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
        if (!Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
        
        if (!Schema::hasColumn('departments', 'deleted_at')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
        
        if (!Schema::hasColumn('projects', 'deleted_at')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
        
        if (!Schema::hasColumn('tasks', 'deleted_at')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        
        Schema::table('departments', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        
        Schema::table('projects', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
