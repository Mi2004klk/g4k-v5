const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/widgets/announcement-board.tsx', 'utf8');

const importAdd = `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@g4k/ui/components";`;
code = code.replace('import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from "@g4k/ui/components";', 'import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from "@g4k/ui/components";\n' + importAdd);

const newQueryVars = `
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: "", body: "", scope: "company", pinned: false });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      setShowCreate(false);
      setCreateData({ title: "", body: "", scope: "company", pinned: false });
      toast.success("Announcement posted");
    },
  });
`;

code = code.replace('const reactMutation = useMutation({', newQueryVars + '\n  const reactMutation = useMutation({');

const newButton = `
        <div className="flex items-center gap-2">
          {isAdminOrHr && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              New Announcement
            </Button>
          )}
        </div>
`;
code = code.replace('        <CardTitle className="text-sm font-bold flex items-center gap-2">\n          <Megaphone className="w-4 h-4 text-violet-600" />\n          Company Announcements\n        </CardTitle>', '        <CardTitle className="text-sm font-bold flex items-center gap-2">\n          <Megaphone className="w-4 h-4 text-violet-600" />\n          Company Announcements\n        </CardTitle>\n' + newButton);

const dialogCode = `
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Title</label>
              <input
                type="text"
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
                value={createData.title}
                onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                placeholder="Enter title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Body</label>
              <textarea
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent resize-none h-24"
                value={createData.body}
                onChange={(e) => setCreateData({ ...createData, body: e.target.value })}
                placeholder="Write your announcement..."
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold">Scope</label>
                <select
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
                  value={createData.scope}
                  onChange={(e) => setCreateData({ ...createData, scope: e.target.value })}
                >
                  <option value="company">Company Wide</option>
                  <option value="team">Specific Team</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="pin-announcement"
                  checked={createData.pinned}
                  onChange={(e) => setCreateData({ ...createData, pinned: e.target.checked })}
                />
                <label htmlFor="pin-announcement" className="text-xs font-semibold">Pin</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button 
              disabled={!createData.title || !createData.body || createMutation.isPending}
              onClick={() => createMutation.mutate(createData)}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}`;

code = code.replace('    </Card>\n  );\n}', dialogCode);

fs.writeFileSync('apps/web/src/components/widgets/announcement-board.tsx', code);
console.log('Patched announcement-board.tsx');
