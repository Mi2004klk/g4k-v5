const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/chat/message-list.tsx', 'utf8');

const seenStr = `
      {isMe && msg.reads && msg.reads.length > 0 && (
        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-neutral-400">
          <span>Seen</span>
        </div>
      )}
`;

code = code.replace('</div>\n    </div>', '</div>' + seenStr + '    </div>');
fs.writeFileSync('apps/web/src/components/chat/message-list.tsx', code);
console.log('Patched message-list.tsx');
