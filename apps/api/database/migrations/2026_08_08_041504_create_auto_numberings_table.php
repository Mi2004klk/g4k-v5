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
        Schema::create('auto_numberings', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type')->unique(); // e.g. 'user', 'department', 'team'
            $table->string('prefix')->nullable();
            $table->integer('start_number')->default(1);
            $table->integer('current_number')->default(0);
            $table->string('format')->nullable(); // e.g. 'EMP-{0000}'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auto_numberings');
    }
};
