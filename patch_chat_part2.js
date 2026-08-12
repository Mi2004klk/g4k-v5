const fs = require('fs');

// Patch conversation-list.tsx
let clCode = fs.readFileSync('apps/web/src/components/chat/conversation-list.tsx', 'utf8');

clCode = clCode.replace('selectedId: number | null;', 'selectedId: number | null;\n  currentUserId: number;');
clCode = clCode.replace('onSelect,\n}: {', 'onSelect,\n  currentUserId,\n}: {');

const unreadLogic = `
          const currentUserData = conv.users?.find((u: any) => u.id === currentUserId);
          const lastReadAt = currentUserData?.pivot?.last_read_at;
          const isUnread = conv.latestMessage &&
            conv.latestMessage.sender_id !== currentUserId &&
            (!lastReadAt || new Date(conv.latestMessage.created_at) > new Date(lastReadAt));
`;

clCode = clCode.replace('          const title = conv.name', unreadLogic + '\n          const title = conv.name');

const unreadBadge = `
                  <h4 className={\`text-xs font-bold truncate \${isUnread ? "text-violet-600 dark:text-violet-400" : "text-neutral-900 dark:text-white"}\`}>
                    {title}
                  </h4>
`;
clCode = clCode.replace('<h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">\n                    {title}\n                  </h4>', unreadBadge);

const unreadDot = `
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={\`text-[11px] truncate \${isUnread ? "text-neutral-800 dark:text-neutral-200 font-medium" : "text-neutral-500"}\`}>
                    {conv.latestMessage ? conv.latestMessage.body : "No messages yet"}
                  </p>
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full bg-violet-600 ml-2 shrink-0"></div>
                  )}
                </div>
`;
clCode = clCode.replace('</div>\n                <p className="text-[11px] text-neutral-500 truncate mt-0.5">\n                  {conv.latestMessage ? conv.latestMessage.body : "No messages yet"}\n                </p>', unreadDot);

fs.writeFileSync('apps/web/src/components/chat/conversation-list.tsx', clCode);
console.log('Patched conversation-list.tsx');

// Patch chat/page.tsx for ConversationList currentUserId and file upload
let pageCode = fs.readFileSync('apps/web/src/app/dashboard/chat/page.tsx', 'utf8');
pageCode = pageCode.replace('<ConversationList', '<ConversationList\n                currentUserId={user?.id as number}');

// Also patch chat/page.tsx sendMessageMutation for file upload
const oldMutation = `const sendMessageMutation = useMutation({
    mutationFn: async ({ body, mentions }: { body: string, mentions: number[] }) => {
      return apiFetch(\`/conversations/\${selectedId}/messages\`, {
        method: "POST",
        body: JSON.stringify({ body, mentions }),
      });
    },`;
const newMutation = `const sendMessageMutation = useMutation({
    mutationFn: async ({ body, mentions, attachment }: { body: string, mentions: number[], attachment?: File | null }) => {
      const formData = new FormData();
      if (body) formData.append("body", body);
      if (mentions && mentions.length > 0) {
        mentions.forEach(m => formData.append("mentions[]", m.toString()));
      }
      if (attachment) {
        formData.append("attachment", attachment);
      }
      return apiFetch(\`/conversations/\${selectedId}/messages\`, {
        method: "POST",
        body: formData,
      });
    },`;
pageCode = pageCode.replace(oldMutation, newMutation);

fs.writeFileSync('apps/web/src/app/dashboard/chat/page.tsx', pageCode);
console.log('Patched chat/page.tsx');
