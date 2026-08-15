<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reactions', function (Blueprint $table) {
            // Check if column exists to avoid errors on multiple runs
            if (!Schema::hasColumn('reactions', 'reactable_id')) {
                $table->dropForeign(['message_id']);
                $table->dropColumn('message_id');
                
                $table->unsignedBigInteger('reactable_id')->nullable();
                $table->string('reactable_type')->nullable();
                
                $table->index(['reactable_id', 'reactable_type']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('reactions', function (Blueprint $table) {
            if (Schema::hasColumn('reactions', 'reactable_id')) {
                $table->dropIndex(['reactable_id', 'reactable_type']);
                $table->dropColumn(['reactable_id', 'reactable_type']);
                
                $table->unsignedBigInteger('message_id')->nullable();
                $table->foreign('message_id')->references('id')->on('messages')->onDelete('cascade');
            }
        });
    }
};
