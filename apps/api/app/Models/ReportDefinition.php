<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportDefinition extends Model
{
    protected $fillable = ['report_key', 'name', 'description'];
}
