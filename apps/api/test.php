<?php
$request = Illuminate\Http\Request::create('/api/dashboard/init', 'GET');
$user = App\Models\User::first();
$request->setUserResolver(fn() => $user);
$user->withAccessToken(new Laravel\Sanctum\PersonalAccessToken(['abilities' => ['role:super_admin']]));
$response = app(App\Http\Controllers\DashboardController::class)->init($request);
echo "SUCCESS: " . substr($response->content(), 0, 100);
