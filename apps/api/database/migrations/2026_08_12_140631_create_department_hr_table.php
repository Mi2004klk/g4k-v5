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
        Schema::create('department_hr', function (Blueprint $t) {
            $t->id();
            $t->foreignId('department_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->unique(['department_id','user_id']);
            $t->timestamps();
        });

        // 2.1d Migration backfill
        $hrs = \Illuminate\Support\Facades\DB::table('users')
            ->join('role_assignments', 'users.id', '=', 'role_assignments.user_id')
            ->whereNotNull('users.department_id')
            ->where('role_assignments.role', 'hr')
            ->select('users.id', 'users.department_id')
            ->distinct()
            ->get();
            
        foreach ($hrs as $hr) {
            \Illuminate\Support\Facades\DB::table('department_hr')->insertOrIgnore([
                'department_id' => $hr->department_id,
                'user_id' => $hr->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_hr');
    }
};
