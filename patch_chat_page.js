const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/dashboard/chat/page.tsx', 'utf8');

// 1. Fix CHAT-1: private channel
code = code.replace('const channel = subscribe(channelName);', 'const channel = subscribe(channelName, true);');

// 2. Fix CHAT-5: Add markReadMutation and call it inside useEffect
const markReadStr = `
  const markReadMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(\`/conversations/\${selectedId}/read\`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(selectedId as number) });
    },
  });

  useEffect(() => {
    if (selectedId) {
      markReadMutation.mutate();
    }
  }, [selectedId]);
`;
// We will insert markReadMutation right before sendMessageMutation
code = code.replace('const sendMessageMutation = useMutation({', markReadStr + '\n  const sendMessageMutation = useMutation({');

// 3. Fix CHAT-4: Mentions passing
// sendMessageMutation needs to accept an object { body: string, mentions: number[] }
const oldMutation = `const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiFetch(\`/conversations/\${selectedId}/messages\`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },`;
const newMutation = `const sendMessageMutation = useMutation({
    mutationFn: async ({ body, mentions }: { body: string, mentions: number[] }) => {
      return apiFetch(\`/conversations/\${selectedId}/messages\`, {
        method: "POST",
        body: JSON.stringify({ body, mentions }),
      });
    },`;
code = code.replace(oldMutation, newMutation);

// Also we need to pass down selectedConv to MessageComposer to get members
// Change `<MessageComposer onSend={(body) => sendMessageMutation.mutate(body)} />`
// Wait, the old code might be different. Let's find it.
const oldComposer = `<MessageComposer onSend={(body) => sendMessageMutation.mutate(body)} />`;
const newComposer = `<MessageComposer onSend={(body, mentions) => sendMessageMutation.mutate({ body, mentions: mentions || [] })} conversation={selectedConv} />`;
code = code.replace(/<MessageComposer onSend=\{\(body\) => sendMessageMutation.mutate\(body\)\}\s*\/>/g, newComposer);
// Let's replace any instance of MessageComposer
code = code.replace(/<MessageComposer[^>]*\/>/g, newComposer);


fs.writeFileSync('apps/web/src/app/dashboard/chat/page.tsx', code);
console.log('Patched chat/page.tsx');
