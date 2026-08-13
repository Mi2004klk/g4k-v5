const fs = require('fs');
const iconMap = {
  UserIcon: 'profile', Folder: 'projects', FolderPlus: 'plus', MessageSquarePlus: 'chat', StickyNote: 'fileText'
};
const filesToFix = [
  'apps/web/src/components/projects/project-card.tsx',
  'apps/web/src/components/projects/projects-tab.tsx',
  'apps/web/src/components/widgets/feedback-form.tsx',
  'apps/web/src/components/widgets/quick-notes.tsx'
];
filesToFix.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  Object.keys(iconMap).forEach(k => {
    content = content.replace(new RegExp('<' + k + '\\b[^>]*>', 'g'), '<AppIcon name="' + iconMap[k] + '" />');
  });
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
