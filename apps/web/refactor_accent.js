const fs = require('fs');

// 1. Update nav-group.tsx
let navGroup = fs.readFileSync('src/components/app-shell/nav-group.tsx', 'utf8');

navGroup = navGroup.replace(
  /className=\{cn\(\s*\"flex-1 flex items-center gap-2\.5 px-2\.5 transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg\"\,[\s\S]*?\)\}/g,
  `className={cn(
          "flex-1 flex items-center gap-2.5 px-2.5 transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg",
          itemPy,
          currentlyCollapsed ? "justify-center px-0 text-xs" : "text-sm",
          isDisabled
            ? "opacity-50 cursor-not-allowed text-neutral-400 dark:text-neutral-600"
            : isActive
            ? "font-semibold shadow-sm ring-1 ring-inset bg-nav-accent/10 dark:bg-nav-accent/10 ring-nav-accent/50 text-nav-accent dark:text-nav-accent"
            : "text-neutral-600 dark:text-neutral-400 font-medium group-hover/nav:bg-opacity-50 hover:bg-nav-accent/20 hover:text-nav-accent"
        )}`
);

navGroup = navGroup.replace(
  /<div className=\"relative group\/nav flex items-center\">/g,
  '<div className="relative group/nav flex items-center" style={{ "--nav-accent": `var(--accent-${accent})` } as React.CSSProperties}>'
);

navGroup = navGroup.replace(
  /<div className=\{cn\(\"w-1\.5 h-1\.5 rounded-full\", accent\.bg\)\} \/>/g,
  '<div className="w-1.5 h-1.5 rounded-full bg-nav-accent" />'
);

fs.writeFileSync('src/components/app-shell/nav-group.tsx', navGroup);
console.log('Updated nav-group.tsx');

// 2. Update layout.tsx
let layout = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Remove accentClasses object entirely
layout = layout.replace(/const accentClasses: Record<string, \{[^\}]+\}> = \{[\s\S]*?\};\n\n/g, '');

// Modify getAccent to just return color
layout = layout.replace(
  /return accentClasses\[color\] \|\| accentClasses\[\"violet\"\];/g,
  'return color;'
);

fs.writeFileSync('src/app/dashboard/layout.tsx', layout);
console.log('Updated layout.tsx');
