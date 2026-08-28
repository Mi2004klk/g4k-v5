<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_type_configs', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->integer('default_allowed')->default(12);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        DB::table('leave_type_configs')->insert([
            ['key' => 'casual', 'label' => 'Casual', 'default_allowed' => 12, 'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'sick', 'label' => 'Sick', 'default_allowed' => 12, 'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'earned', 'label' => 'Earned/EL', 'default_allowed' => 12, 'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'unpaid', 'label' => 'Unpaid', 'default_allowed' => 12, 'is_active' => true, 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_type_configs');
    }
};
