<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportDefinition extends Model
{
    use \App\Traits\HasDemoTag;
    protected $fillable = ['report_key', 'name', 'description', 'demo_tag'];
}
