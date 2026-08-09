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
        Schema::create('capabilities', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('description')->nullable();
            $table->string('group')->nullable();
            $table->timestamps();
        });

        Schema::create('role_capabilities', function (Blueprint $table) {
            $table->string('role');
            $table->string('capability_key');
            $table->primary(['role', 'capability_key']);
            $table->foreign('capability_key')->references('key')->on('capabilities')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_capabilities');
        Schema::dropIfExists('capabilities');
    }
};
