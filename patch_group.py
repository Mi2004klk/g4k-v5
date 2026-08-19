import re

with open('apps/web/src/components/chat/create-group-dialog.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { useAuthStore } from "@/lib/auth-store";', 'import { useAuthStore } from "@/lib/auth-store";\nimport { useFormDraft } from "@/hooks/use-form-draft";\nimport { Alert, AlertDescription, AlertTitle } from "@g4k/ui/components";\nimport { AppIcon } from "@g4k/ui/components";')

hook_code = '''
  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("group_create", { name: "", selectedUsers: [] as number[], tab: "dm" as "dm" | "group" });

  const activeName = name || draftData.name;
  const activeSelectedUsers = selectedUsers.length > 0 ? selectedUsers : draftData.selectedUsers;
  const activeTab = tab !== "dm" ? tab : draftData.tab;

  const handleFieldChange = (updates: any) => {
    setDraftData({
      name: name || draftData.name,
      selectedUsers: selectedUsers.length > 0 ? selectedUsers : draftData.selectedUsers,
      tab: tab !== "dm" ? tab : draftData.tab,
      ...updates
    });
  };
'''

content = content.replace('const currentUser = useAuthStore((s) => s.user);', hook_code + '\n  const currentUser = useAuthStore((s) => s.user);')

alert_code = '''
        {hasDraft && (
          <Alert className="mb-2 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
            <AlertTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm">
              <AppIcon name="history" size="sm" />
              Draft Available
            </AlertTitle>
            <AlertDescription className="text-blue-700/80 dark:text-blue-400 text-xs flex items-center justify-between mt-1">
              <span>You have an unsaved draft.</span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={restoreDraft}>Restore</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40" onClick={clearDraft}>Discard</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
'''
content = content.replace('<div className="flex gap-2 mb-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">', alert_code + '\n        <div className="flex gap-2 mb-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">')

content = content.replace('setName("")', 'setName(""); clearDraft()')
content = content.replace('onClick={() => { setTab("dm"); setSelectedUsers([]); }}', 'onClick={() => { setTab("dm"); setSelectedUsers([]); handleFieldChange({ tab: "dm", selectedUsers: [] }); }}')
content = content.replace('onClick={() => { setTab("group"); setSelectedUsers([]); }}', 'onClick={() => { setTab("group"); setSelectedUsers([]); handleFieldChange({ tab: "group", selectedUsers: [] }); }}')

content = content.replace('onChange={(e) => setName(e.target.value)}', 'onChange={(e) => { setName(e.target.value); handleFieldChange({ name: e.target.value }); }}')

# Update active uses
content = content.replace('if (tab === "dm") {', 'if (activeTab === "dm") {')
content = content.replace('body: JSON.stringify({ recipient_id: selectedUsers[0] }),', 'body: JSON.stringify({ recipient_id: activeSelectedUsers[0] }),')
content = content.replace('body: JSON.stringify({ name, member_ids: selectedUsers }),', 'body: JSON.stringify({ name: activeName, member_ids: activeSelectedUsers }),')
content = content.replace('if (tab === "group" && !name.trim())', 'if (activeTab === "group" && !activeName.trim())')
content = content.replace('if (selectedUsers.length === 0)', 'if (activeSelectedUsers.length === 0)')
content = content.replace('if (tab === "dm") {', 'if (activeTab === "dm") {')
content = content.replace('value={name}', 'value={activeName}')
content = content.replace('selectedUsers.includes', 'activeSelectedUsers.includes')
content = content.replace('selectedUsers.filter', 'activeSelectedUsers.filter')
content = content.replace('tab === "dm"', 'activeTab === "dm"')
content = content.replace('tab === "group"', 'activeTab === "group"')

# Fix toggleUser
toggle_code = '''
  const toggleUser = (userId: number) => {
    if (activeTab === "dm") {
      setSelectedUsers([userId]);
      handleFieldChange({ selectedUsers: [userId] });
    } else {
      if (activeSelectedUsers.includes(userId)) {
        const newUsers = activeSelectedUsers.filter(id => id !== userId);
        setSelectedUsers(newUsers);
        handleFieldChange({ selectedUsers: newUsers });
      } else {
        const newUsers = [...activeSelectedUsers, userId];
        setSelectedUsers(newUsers);
        handleFieldChange({ selectedUsers: newUsers });
      }
    }
  };
'''
content = re.sub(r'const toggleUser = \(userId: number\) => \{.*?\n  \};', toggle_code.strip(), content, flags=re.DOTALL)


with open('apps/web/src/components/chat/create-group-dialog.tsx', 'w') as f:
    f.write(content)

print("create-group-dialog updated")
