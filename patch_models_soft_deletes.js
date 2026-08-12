const fs = require('fs');

function patchModel(file) {
    let code = fs.readFileSync(file, 'utf8');
    if (!code.includes('use Illuminate\\Database\\Eloquent\\SoftDeletes;')) {
        code = code.replace(/use Illuminate\\Database\\Eloquent\\Model;/, 'use Illuminate\\Database\\Eloquent\\Model;\nuse Illuminate\\Database\\Eloquent\\SoftDeletes;');
    }
    // For User model it might be different
    if (file.includes('User.php')) {
        if (!code.includes('use Illuminate\\Database\\Eloquent\\SoftDeletes;')) {
            code = code.replace(/use Illuminate\\Foundation\\Auth\\User as Authenticatable;/, 'use Illuminate\\Foundation\\Auth\\User as Authenticatable;\nuse Illuminate\\Database\\Eloquent\\SoftDeletes;');
        }
    }
    
    if (!code.includes('use SoftDeletes;')) {
        code = code.replace(/use HasFactory/g, 'use HasFactory, SoftDeletes');
        // If the model is User, there might be use Notifiable
        if (code.includes('use HasApiTokens, HasFactory, Notifiable;')) {
             code = code.replace(/use HasApiTokens, HasFactory, Notifiable;/, 'use HasApiTokens, HasFactory, Notifiable, SoftDeletes;');
             // We replaced HasFactory, but if HasFactory was changed by previous line, let's just make sure.
             code = code.replace(/use HasFactory, SoftDeletes, SoftDeletes/g, 'use HasFactory, SoftDeletes');
        }
    }
    
    fs.writeFileSync(file, code);
}

patchModel('apps/api/app/Models/User.php');
patchModel('apps/api/app/Models/Department.php');
patchModel('apps/api/app/Models/Project.php');
patchModel('apps/api/app/Models/Task.php');

console.log('Patched Models with SoftDeletes');
