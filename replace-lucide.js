const fs = require('fs');
const path = require('path');

const iconMap = {
  Check: 'check', ChevronDown: 'chevronDown', ChevronUp: 'chevronUp', ChevronsUpDown: 'chevronsUpDown',
  Minus: 'minus', X: 'close', XIcon: 'close', Search: 'search', ChevronRight: 'chevronRight',
  Circle: 'circle', MoreHorizontal: 'moreH', ChevronLeft: 'chevronLeft', Loader2: 'loading',
  Eye: 'eye', EyeOff: 'eyeOff', CircleCheck: 'success', LoaderCircle: 'loading',
  TriangleAlert: 'warning', AlertTriangle: 'warning', OctagonX: 'error', Settings2: 'sliders',
  Pencil: 'edit', Inbox: 'inbox', RefreshCw: 'refresh', WifiOff: 'wifiOff',
  SlidersHorizontal: 'sliders', Calendar: 'calendar', CalendarIcon: 'calendar', ArrowDownAZ: 'sortAsc',
  ArrowUpAZ: 'sortDesc', ArrowDown: 'arrowDown', ArrowUp: 'arrowUp', UploadCloud: 'upload',
  File: 'file', FileIcon: 'file', Calculator: 'calculator', CreditCard: 'creditCard', Map: 'map',
  Smile: 'faceSmile', LayoutDashboard: 'dashboard', CalendarCheck: 'attendance', FolderKanban: 'projects',
  MessageSquare: 'chat', Users: 'directory', Clock: 'teamAttendance', Settings: 'settings',
  ShieldAlert: 'audit', UserCircle: 'profile', Home: 'home', Plus: 'plus', Trash2: 'trash',
  Edit: 'edit', Edit2: 'edit', Pen: 'edit', FileEdit: 'edit', Save: 'save', SaveAll: 'save',
  Download: 'download', Upload: 'upload', Send: 'send', Filter: 'filter', Copy: 'copy',
  ExternalLink: 'externalLink', MoreVertical: 'more', Menu: 'menu', Pin: 'pin',
  ArchiveRestore: 'archiveRestore', Archive: 'archive', Expand: 'expand', CheckCircle2: 'success',
  CheckCircle: 'success', CircleAlert: 'error', AlertCircle: 'error', Info: 'info',
  HelpCircle: 'question', Star: 'star', Award: 'award', Flag: 'flag', ChevronsUpDown: 'chevronsUpDown',
  ArrowRight: 'arrowRight', ArrowLeft: 'arrowLeft', ArrowUpRight: 'arrowUpRight', ArrowDownRight: 'arrowDownRight',
  Timer: 'timer', Stopwatch: 'timer', Play: 'play', Pause: 'pause', Square: 'stop', Stop: 'stop',
  Coffee: 'break', CalendarDays: 'calendar', CalendarX: 'calendarX', LogIn: 'login', LogOut: 'logout',
  MonitorSmartphone: 'devices', Monitor: 'computer', TrendingUp: 'trendingUp', Activity: 'activity',
  History: 'history', User: 'profile', UserCheck: 'userCheck', UserX: 'userX', ShieldCheck: 'shieldCheck',
  Shield: 'shield', KeyRound: 'key', Building2: 'building', Briefcase: 'briefcase', Bell: 'bell',
  Mail: 'mail', MailOpen: 'mailOpen', Phone: 'phone', MapPin: 'location', Paperclip: 'paperclip',
  CheckCheck: 'read', Hash: 'hash', Globe: 'globe', FileText: 'fileText', FileSpreadsheet: 'spreadsheet',
  ClipboardList: 'clipboard', CheckSquare: 'tasks', ListTodo: 'tasks', List: 'list', ListIcon: 'list',
  Grid: 'grid', LayoutGrid: 'grid', Kanban: 'kanban', Rows2: 'density', Rows3: 'density',
  BarChart3: 'chart', Command: 'command', Megaphone: 'announcement', Plane: 'plane', Sun: 'sun', Moon: 'moon', Laptop: 'laptop'
};

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      processFile(fullPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  const lucideRegex = /import\s+({[^}]+})\s+from\s+["']lucide-react["'];?/g;
  let match;
  let hasLucide = false;
  let iconsToReplace = [];

  while ((match = lucideRegex.exec(content)) !== null) {
    hasLucide = true;
    const importsStr = match[1].replace(/[{}]/g, '');
    const importedIcons = importsStr.split(',').map(s => {
      const parts = s.trim().split(/\s+as\s+/);
      return parts.length > 1 ? parts[1] : parts[0];
    }).filter(Boolean);
    iconsToReplace.push(...importedIcons);
  }

  if (hasLucide) {
    content = content.replace(lucideRegex, 'import { AppIcon, IconName } from "@g4k/ui/components";');
    
    // Also change LucideIcon to IconName in types
    content = content.replace(/LucideIcon/g, 'IconName');

    iconsToReplace.forEach(lucideName => {
      const appIconName = iconMap[lucideName];
      if (!appIconName) {
        console.warn(`NO MAPPING FOR ${lucideName} in ${filePath}`);
        return;
      }

      // Replace JSX tags
      const tagRegex = new RegExp(`<${lucideName}\\b([^>]*)>`, 'g');
      content = content.replace(tagRegex, (match, props) => {
        let size = 'md';
        if (props.includes('w-3 ') || props.includes('w-3"')) size = 'xs';
        else if (props.includes('w-3.5')) size = 'sm';
        else if (props.includes('w-5') || props.includes('h-5')) size = 'lg';
        else if (props.includes('w-6') || props.includes('h-6')) size = 'xl';
        else if (props.includes('w-8')) size = '2xl';
        else if (props.includes('w-12') || props.includes('w-16')) size = 'hero';

        let newProps = `name="${appIconName}"`;
        if (size !== 'md') newProps += ` size="${size}"`;

        let cleanProps = props;
        cleanProps = cleanProps.replace(/w-\d+(\.\d+)?/g, '').replace(/h-\d+(\.\d+)?/g, '');
        cleanProps = cleanProps.replace(/className=(["']) *["']/g, '');
        cleanProps = cleanProps.replace(/\s+/g, ' ');

        return `<AppIcon ${newProps}${cleanProps}>`;
      });
      
      const closeTagRegex = new RegExp(`</${lucideName}>`, 'g');
      content = content.replace(closeTagRegex, `</AppIcon>`);

      // Replace icon reference in arrays/objects: `icon: LayoutDashboard` -> `icon: "dashboard"`
      // OR `icon={LayoutDashboard}` -> `icon="dashboard"`
      const propRegex = new RegExp(`icon(\\s*:\\s*|={\\s*)${lucideName}(?!\\w)`, 'g');
      content = content.replace(propRegex, `icon$1"${appIconName}"`);
      
      const componentPropRegex = new RegExp(`Icon(\\s*:\\s*|={\\s*)${lucideName}(?!\\w)`, 'g');
      content = content.replace(componentPropRegex, `Icon$1"${appIconName}"`);
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
}

const basePath = path.join(__dirname, 'apps', 'web', 'src');
processDirectory(basePath);
