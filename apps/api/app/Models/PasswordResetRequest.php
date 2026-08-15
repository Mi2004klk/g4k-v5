<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetRequest extends Model
{
    use \App\Traits\HasDemoTag;

    protected $fillable = ['user_id', 'status', 'admin_id', 'demo_tag', 'is_demo'];
}
