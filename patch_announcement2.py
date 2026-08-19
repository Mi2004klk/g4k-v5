import re

with open('apps/web/src/components/widgets/announcement-board.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('import { useAuthStore } from "@/lib/auth-store";', 'import { useAuthStore } from "@/lib/auth-store";\nimport { useFormDraft } from "@/hooks/use-form-draft";\nimport { Alert, AlertDescription, AlertTitle } from "@g4k/ui/components";')

hook_code = '''
  const { formData: draftData, setFormData: setDraftData, hasDraft, restoreDraft, clearDraft } = useFormDraft("announcement_create", { title: "", body: "", scope: "company", pinned: false });

  const activeCreateData = {
    title: createData.title || draftData.title,
    body: createData.body || draftData.body,
    scope: createData.scope !== "company" ? createData.scope : draftData.scope,
    pinned: createData.pinned !== false ? createData.pinned : draftData.pinned,
  };

  const handleFieldChange = (updates: any) => {
    setDraftData({
      title: createData.title || draftData.title,
      body: createData.body || draftData.body,
      scope: createData.scope !== "company" ? createData.scope : draftData.scope,
      pinned: createData.pinned !== false ? createData.pinned : draftData.pinned,
      ...updates
    });
  };
'''

content = content.replace('const [createData, setCreateData] = useState({ title: "", body: "", scope: "company", pinned: false });', 'const [createData, setCreateData] = useState({ title: "", body: "", scope: "company", pinned: false });\n' + hook_code)

alert_code = '''
            {hasDraft && !editingId && (
              <Alert className="mb-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
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

content = content.replace('<div className="space-y-4">', '<div className="space-y-4">\n' + alert_code)

content = content.replace('value={createData.title}', 'value={editingId ? createData.title : activeCreateData.title}')
content = content.replace('onChange={(e) => setCreateData(prev => ({ ...prev, title: e.target.value }))}', 'onChange={(e) => { setCreateData(prev => ({ ...prev, title: e.target.value })); if (!editingId) handleFieldChange({ title: e.target.value }); }}')

content = content.replace('value={createData.body}', 'value={editingId ? createData.body : activeCreateData.body}')
content = content.replace('onChange={(e) => setCreateData(prev => ({ ...prev, body: e.target.value }))}', 'onChange={(e) => { setCreateData(prev => ({ ...prev, body: e.target.value })); if (!editingId) handleFieldChange({ body: e.target.value }); }}')

content = content.replace('value={createData.scope}', 'value={editingId ? createData.scope : activeCreateData.scope}')
content = content.replace('onValueChange={(v) => setCreateData(prev => ({ ...prev, scope: v }))}', 'onValueChange={(v) => { setCreateData(prev => ({ ...prev, scope: v })); if (!editingId) handleFieldChange({ scope: v }); }}')

content = content.replace('checked={createData.pinned}', 'checked={editingId ? createData.pinned : activeCreateData.pinned}')
content = content.replace('onCheckedChange={(c) => setCreateData(prev => ({ ...prev, pinned: !!c }))}', 'onCheckedChange={(c) => { setCreateData(prev => ({ ...prev, pinned: !!c })); if (!editingId) handleFieldChange({ pinned: !!c }); }}')

content = content.replace('setCreateData({ title: "", body: "", scope: "company", pinned: false })', 'setCreateData({ title: "", body: "", scope: "company", pinned: false }); clearDraft();')

content = content.replace('body: JSON.stringify({ ...createData, pinned_at: createData.pinned ? new Date().toISOString() : null }),', 'body: JSON.stringify({ ...(editingId ? createData : activeCreateData), pinned_at: (editingId ? createData.pinned : activeCreateData.pinned) ? new Date().toISOString() : null }),')

with open('apps/web/src/components/widgets/announcement-board.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("announcement-board updated")
