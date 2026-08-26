<?php

use Illuminate\Support\Facades\Broadcast;


Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('presence-org', function ($user) {
    if ($user) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
        ];
    }
    return false;
});

Broadcast::channel('org.announcements', function ($user) {
    return $user !== null;
});

Broadcast::channel('company.global', function ($user) {
    return $user !== null;
});

Broadcast::channel('conversation.{id}', function ($user, $id) {
    $conversation = \App\Models\Conversation::find($id);
    if (!$conversation) {
        return false;
    }
    if ($conversation->scope === 'global') {
        return true;
    }
    return \Illuminate\Support\Facades\DB::table('conversation_user')
        ->where('user_id', $user->id)
        ->where('conversation_id', $id)
        ->exists();
});

Broadcast::channel('approvals.{role}', function ($user, $role) {
    $roles = \App\Models\RoleAssignment::getRolesForUser($user->id);
    return in_array($role, $roles) || in_array('super_admin', $roles);
});

Broadcast::channel('project.{id}', function ($user, $id) {
    $project = \App\Models\Project::find($id);
    if (!$project) return false;
    
    $roles = \App\Models\RoleAssignment::getRolesForUser($user->id);
    if (in_array('super_admin', $roles) || in_array('admin', $roles)) return true;
    if (in_array('hr', $roles)) {
        $deptIds = \App\Support\HrScope::managedDepartmentIds($user);
        return in_array($project->department_id, $deptIds);
    }
    
    return $project->created_by === $user->id || $project->members()->where('users.id', $user->id)->exists();
});

Broadcast::channel('department.{id}', function ($user, $id) {
    $roles = \App\Models\RoleAssignment::getRolesForUser($user->id);
    if (in_array('super_admin', $roles) || in_array('admin', $roles)) return true;
    if (in_array('hr', $roles)) {
        $deptIds = \App\Support\HrScope::managedDepartmentIds($user);
        return in_array($id, $deptIds);
    }
    
    return (int) $user->department_id === (int) $id;
});

Broadcast::channel('attendance.{id}', function ($user, $id) {
    $roles = \App\Models\RoleAssignment::getRolesForUser($user->id);
    if (in_array('super_admin', $roles) || in_array('admin', $roles)) return true;
    if (in_array('hr', $roles)) {
        $deptIds = \App\Support\HrScope::managedDepartmentIds($user);
        return in_array($id, $deptIds);
    }
    
    return (int) $user->department_id === (int) $id;
});
