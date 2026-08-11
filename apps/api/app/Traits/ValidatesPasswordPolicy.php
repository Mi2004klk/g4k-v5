<?php

namespace App\Traits;

use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

trait ValidatesPasswordPolicy
{
    protected function getPasswordPolicyRule()
    {
        $settings = Cache::remember('settings:security', 60 * 60, function () {
            return DB::table('settings')
                ->where('category', 'security')
                ->pluck('value', 'key')
                ->toArray();
        });
            
        $min = (int) ($settings['password.min_length'] ?? 8);
        $rule = Password::min($min);
        
        if (filter_var($settings['password.require_mixed'] ?? 'true', FILTER_VALIDATE_BOOLEAN)) {
            $rule = $rule->mixedCase();
        }
        if (filter_var($settings['password.require_number'] ?? 'true', FILTER_VALIDATE_BOOLEAN)) {
            $rule = $rule->numbers();
        }
        if (filter_var($settings['password.require_symbol'] ?? 'true', FILTER_VALIDATE_BOOLEAN)) {
            $rule = $rule->symbols();
        }
        
        return $rule;
    }
}
