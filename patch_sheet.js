const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/tasks/task-detail-sheet.tsx', 'utf8');

// Add imports
code = code.replace('import { Button } from "@g4k/ui/components";', 'import { Button, Slider } from "@g4k/ui/components";');
code = code.replace('import { CheckCircle2, Clock, Send, Loader2, AlertCircle } from "lucide-react";', 'import { CheckCircle2, Clock, Send, Loader2, AlertCircle, Play, Square } from "lucide-react";');

// Add state for timer
code = code.replace('const [minutesLogged, setMinutesLogged] = useState("");', 'const [minutesLogged, setMinutesLogged] = useState("");\n  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);');

// Add progress mutation
const progressMutationStr = `
  const progressMutation = useMutation({
    mutationFn: async (progress: number) => {
      return apiFetch(\`/tasks/\${task.id}\`, {
        method: "PUT",
        body: JSON.stringify({ progress }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks, exact: true });
    },
  });
`;

code = code.replace('const commentMutation = useMutation({', progressMutationStr + '\n  const commentMutation = useMutation({');

// Add progress slider
const progressSliderStr = `
            <div className="py-2">
              <div className="flex justify-between items-center mb-2 text-neutral-500 font-semibold text-[11px]">
                <span>Progress</span>
                <span>{task.progress || 0}%</span>
              </div>
              <Slider
                defaultValue={[task.progress || 0]}
                max={100}
                step={5}
                onValueCommit={(vals) => progressMutation.mutate(vals[0])}
              />
            </div>
`;
code = code.replace('{/* QA Form section if attached */}', progressSliderStr + '\n\n            {/* QA Form section if attached */}');

// Add Timer Start/Stop
const timerButtonStr = `
              <div className="flex gap-2 w-full mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {!timerStartTime ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-900/30"
                    onClick={() => setTimerStartTime(Date.now())}
                  >
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Start Timer
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="w-full h-8"
                    onClick={() => {
                      const minutes = Math.max(1, Math.round((Date.now() - timerStartTime) / 60000));
                      timerMutation.mutate(minutes);
                      setTimerStartTime(null);
                    }}
                    disabled={timerMutation.isPending}
                  >
                    <Square className="w-3.5 h-3.5 mr-2" />
                    Stop Timer
                  </Button>
                )}
              </div>
`;

code = code.replace('</Button>\n              </div>\n            </div>', '</Button>\n              </div>' + timerButtonStr + '\n            </div>');

fs.writeFileSync('apps/web/src/components/tasks/task-detail-sheet.tsx', code);
console.log("Patched task-detail-sheet.tsx");
