const fs = require('fs');

let code = fs.readFileSync('apps/web/src/app/dashboard/profile/page.tsx', 'utf8');

// Add Switch component import if not already there, actually it uses default HTML switches or buttons. Wait, I see Lucide icons.
// I'll add the new card after the Privacy & Visibility Card.
const oldVisibilityEnd = `             </CardContent>
           </Card>`;

const newVisibilityEnd = `             </CardContent>
           </Card>

           {/* Notification Preferences */}
           <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-xl">
             <CardHeader>
               <CardTitle className="text-base font-bold flex items-center gap-2 font-display text-neutral-900 dark:text-white">
                 <Settings className="w-4 h-4 text-brand-violet" />
                 Notification Preferences
               </CardTitle>
               <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                 Toggle which in-app notifications you wish to receive.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 gap-2">
                   {['system', 'security', 'tasks', 'general'].map((type) => {
                     const isEnabled = authUser?.preferences?.notifications?.[type] !== false;
                     return (
                       <button
                         key={type}
                         onClick={() => {
                           const newPrefs = {
                             ...authUser?.preferences,
                             notifications: {
                               ...authUser?.preferences?.notifications,
                               [type]: !isEnabled
                             }
                           };
                           updateProfileMutation.mutate({ preferences: newPrefs });
                           if (authUser) {
                             setAuth(useAuthStore.getState().token!, { ...authUser, preferences: newPrefs }, authUser.active_role);
                           }
                         }}
                         disabled={updateProfileMutation.isPending}
                         className={\`p-3 text-left border rounded-lg transition-colors flex justify-between items-center \${isEnabled ? "border-brand-violet bg-brand-violet/5" : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}\`}
                       >
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white mb-0.5 capitalize">{type} Notifications</div>
                            <div className="text-neutral-500 text-[11px]">Receive updates regarding {type}.</div>
                          </div>
                          <div className={\`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 \${isEnabled ? 'bg-brand-violet' : 'bg-neutral-300 dark:bg-neutral-700'}\`}>
                            <div className={\`w-4 h-4 rounded-full bg-white shadow-sm transition-transform \${isEnabled ? 'translate-x-5' : 'translate-x-0'}\`} />
                          </div>
                       </button>
                     );
                   })}
                </div>
             </CardContent>
           </Card>`;

code = code.replace(oldVisibilityEnd, newVisibilityEnd);

fs.writeFileSync('apps/web/src/app/dashboard/profile/page.tsx', code);
console.log('Patched profile/page.tsx for CFG-4');
