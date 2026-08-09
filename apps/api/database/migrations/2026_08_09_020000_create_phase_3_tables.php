<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme_mode')->default('system');
            $table->string('density')->default('comfortable');
        });

        Schema::create('pins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('target_id');
            $table->string('label');
            $table->string('href');
            $table->string('icon')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pins');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['theme_mode', 'density']);
        });
    }
};
