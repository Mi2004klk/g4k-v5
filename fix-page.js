const fs = require('fs');
const path = require('path');
const p = path.resolve('apps/web/src/app/dashboard/profile/page.tsx');
let content = fs.readFileSync(p, 'utf-8');

// Replace lucide-react import
content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]lucide-react['"];/, 'import { AppIcon, IconName } from "@g4k/ui/components";');

// Replace standard Lucide icons
const iconMap = {
  User: 'profile',
  Phone: 'phone',
  Mail: 'mail',
  KeyRound: 'key',
  Laptop: 'laptop',
  Trash2: 'trash',
  Upload: 'upload',
  Loader2: 'loading',
  Eye: 'eye',
  Building2: 'building',
  ExternalLink: 'externalLink',
  Calendar: 'calendar',
  FileText: 'fileText',
  CheckSquare: 'tasks',
  Hash: 'hash',
  CalendarDays: 'calendar',
  MapPin: 'mapPin',
  Briefcase: 'briefcase',
  AlertCircle: 'warning',
  CheckCircle2: 'success',
  Shield: 'shield',
  EyeOff: 'eyeOff',
  LayoutDashboard: 'dashboard',
  Settings: 'settings'
};

for (const [lucide, appIcon] of Object.entries(iconMap)) {
  const regex1 = new RegExp(`<${lucide}(\\s+[^>]*?)?/>`, 'g');
  content = content.replace(regex1, (match, attrs) => {
    let className = '';
    if (attrs) {
      // Extract className if exists
      const matchCls = attrs.match(/className=["']([^"']*)["']/);
      if (matchCls) {
        className = matchCls[1];
        className = className.replace(/\bw-\d+\b/g, '').replace(/\bh-\d+\b/g, '').trim();
        if (appIcon === 'loading') {
          className = className + ' animate-spin';
        }
      }
    }
    return `<AppIcon name="${appIcon}"${className ? ` className=" ${className}"` : ''} />`;
  });
}

// Fix designation syntax
content = content.replace(/setDesignationId\(e\.target\.value\)\(v as any\)/g, 'setDesignationId(v as string)');

// Fix F13: Wrap password fields in form
content = content.replace(/<CardContent className="space-y-4 text-xs font-sans">\s*<div>\s*<label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Current Password<\/label>/, 
`<CardContent className="text-xs font-sans">
               <form 
                 className="space-y-4" 
                 onSubmit={(e) => { 
                   e.preventDefault(); 
                   if (!changePasswordMutation.isPending && currentPassword && newPassword && confirmPassword) {
                     changePasswordMutation.mutate(); 
                   }
                 }}
               >
                 <div>
                   <label className="font-semibold block mb-1 text-neutral-700 dark:text-neutral-300">Current Password</label>`);

content = content.replace(/\{changePasswordMutation\.isPending \? \(\s*<AppIcon name="loading" className="  animate-spin" \/>\s*\) : \(\s*"Update Password"\s*\)\}\s*<\/Button>\s*<\/CardContent>/m,
`{changePasswordMutation.isPending ? (
                    <AppIcon name="loading" className=" animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </Button>
               </form>
             </CardContent>`);

fs.writeFileSync(p, content, 'utf-8');
console.log('Fixed page.tsx');
