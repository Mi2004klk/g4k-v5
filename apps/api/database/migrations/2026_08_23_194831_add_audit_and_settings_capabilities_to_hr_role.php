<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $capabilities = ['audit.view', 'settings.manage'];
        foreach ($capabilities as $cap) {
            \Illuminate\Support\Facades\DB::table('role_capabilities')
                ->updateOrInsert(['role' => 'hr', 'capability_key' => $cap], ['created_at' => now(), 'updated_at' => now()]);
        }
        
        \App\Services\CapabilityMatrix::clearCache();
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::table('role_capabilities')
            ->where('role', 'hr')
            ->whereIn('capability_key', ['audit.view', 'settings.manage'])
            ->delete();
            
        \App\Services\CapabilityMatrix::clearCache();
    }
};
