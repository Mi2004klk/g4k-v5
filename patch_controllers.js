const fs = require('fs');

// AuthController
let authCode = fs.readFileSync('apps/api/app/Http/Controllers/AuthController.php', 'utf8');

authCode = authCode.replace('class AuthController extends Controller\n{', 'use App\\Traits\\ValidatesPasswordPolicy;\n\nclass AuthController extends Controller\n{\n    use ValidatesPasswordPolicy;');

const oldGetPolicy = `    private function getPasswordPolicyRule()
    {
        $settings = \\Illuminate\\Support\\Facades\\DB::table('settings')
            ->where('category', 'security')
            ->pluck('value', 'key');
            
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
    }`;

authCode = authCode.replace(oldGetPolicy, '');

fs.writeFileSync('apps/api/app/Http/Controllers/AuthController.php', authCode);
console.log('Patched AuthController.php');

// ProfileController
let profileCode = fs.readFileSync('apps/api/app/Http/Controllers/ProfileController.php', 'utf8');

profileCode = profileCode.replace('class ProfileController extends Controller\n{', 'use App\\Traits\\ValidatesPasswordPolicy;\n\nclass ProfileController extends Controller\n{\n    use ValidatesPasswordPolicy;');

profileCode = profileCode.replace(
    'Password::min(8)->mixedCase()->numbers()->symbols()',
    '$this->getPasswordPolicyRule()'
);

// We need to also add preferences update to ProfileController for CFG-4
const oldUpdate = `    public function update(Request $request)
    {
        $user = $request->user();
        $before = $user->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar_url' => 'nullable|string',
        ]);

        $user->update($validated);`;

const newUpdate = `    public function update(Request $request)
    {
        $user = $request->user();
        $before = $user->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar_url' => 'nullable|string',
            'preferences' => 'nullable|array',
        ]);

        $user->update($validated);`;

profileCode = profileCode.replace(oldUpdate, newUpdate);

fs.writeFileSync('apps/api/app/Http/Controllers/ProfileController.php', profileCode);
console.log('Patched ProfileController.php');
