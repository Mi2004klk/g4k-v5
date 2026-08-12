const fs = require('fs');

let code = fs.readFileSync('apps/web/src/app/dashboard/org/departments/page.tsx', 'utf8');

// I need to add state for the new team input, mutation to create and delete.
const oldStateEnd = `  const [editingDept, setEditingDept] = useState<any>(null);

  const [selectedDeptMembers, setSelectedDeptMembers] = useState<any>(null);`;

const newStateEnd = `  const [editingDept, setEditingDept] = useState<any>(null);

  const [selectedDeptMembers, setSelectedDeptMembers] = useState<any>(null);
  const [newTeamName, setNewTeamName] = useState("");

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => apiFetch(\`/departments/\${selectedDeptMembers?.id}/teams\`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),
    onSuccess: () => {
      toast.success("Team added.");
      setNewTeamName("");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: any) => toast.error(err.message || "Failed to add team")
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => apiFetch(\`/departments/\${selectedDeptMembers?.id}/teams/\${teamId}\`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      toast.success("Team deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.department(selectedDeptMembers?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete team")
  });`;

code = code.replace(oldStateEnd, newStateEnd);

const oldSheetContentEnd = `              <div className="space-y-3">
                {deptDetails.users.map((user: any) => (
                  <div key={user.id} className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-violet-100 text-violet-700 font-bold">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.designation?.name || "Employee"} • {user.employee_id || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>`;

const newSheetContentEnd = `              <div className="space-y-3">
                {deptDetails.users.map((user: any) => (
                  <div key={user.id} className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-violet-100 text-violet-700 font-bold">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.designation?.name || "Employee"} • {user.employee_id || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Teams Management */}
            <div className="mt-8">
               <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Sub-teams</h3>
               
               {isAdmin && (
                 <div className="flex items-center gap-2 mb-4">
                   <Input 
                     placeholder="New team name..." 
                     value={newTeamName} 
                     onChange={(e: any) => setNewTeamName(e.target.value)}
                     className="h-8 text-sm"
                     onKeyDown={(e: any) => {
                       if (e.key === 'Enter' && newTeamName.trim()) {
                         createTeamMutation.mutate(newTeamName.trim());
                       }
                     }}
                   />
                   <Button 
                     size="sm" 
                     className="h-8" 
                     disabled={!newTeamName.trim() || createTeamMutation.isPending}
                     onClick={() => createTeamMutation.mutate(newTeamName.trim())}
                   >
                     {createTeamMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                   </Button>
                 </div>
               )}
               
               {deptDetails?.teams?.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {deptDetails.teams.map((team: any) => (
                     <div key={team.id} className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 border dark:border-neutral-700 px-3 py-1.5 rounded-full text-xs text-neutral-700 dark:text-neutral-300">
                       <Users className="w-3 h-3 text-neutral-500" />
                       {team.name}
                       {isAdmin && (
                         <button 
                           onClick={() => deleteTeamMutation.mutate(team.id)}
                           disabled={deleteTeamMutation.isPending}
                           className="ml-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-0.5 rounded-full text-rose-500 transition-colors"
                           title="Delete Team"
                         >
                           <Trash2 className="w-3 h-3" />
                         </button>
                       )}
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-xs text-neutral-500 italic">No sub-teams created yet.</p>
               )}
            </div>
          </div>
        </SheetContent>`;

code = code.replace(oldSheetContentEnd, newSheetContentEnd);

fs.writeFileSync('apps/web/src/app/dashboard/org/departments/page.tsx', code);
console.log('Patched departments/page.tsx for ORG-5');
