const fs = require('fs');
let file = 'src/app/dashboard/chat/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<FeedbackForm \/>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n  \);\n}/, '<FeedbackForm />\n        </div>\n      </div>\n    </PageContainer>\n  );\n}');
fs.writeFileSync(file, content);
console.log('Fixed chat page');
