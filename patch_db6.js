const fs = require('fs');

function addWarning(file) {
    let code = fs.readFileSync(file, 'utf8');
    const warning = `
    /**
     * DB-6 WARNING:
     * Currently, the database assumes a single-company architecture where names are globally unique.
     * If multi-company architecture is ever introduced, the unique constraints on the 'name' column
     * must be scoped to 'company_id' to prevent collisions between different tenants.
     */`;
    
    code = code.replace("class", warning + "\nclass");
    fs.writeFileSync(file, code);
}

addWarning('apps/api/app/Models/Department.php');
addWarning('apps/api/app/Models/Designation.php');

console.log('Patched Models for DB-6');
