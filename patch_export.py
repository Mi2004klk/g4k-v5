import re

with open('apps/web/src/components/reports/export-history.tsx', 'r') as f:
    content = f.read()

# Add state for showAll
content = content.replace('export function ExportHistory() {', 'import { useState as useStateLocal } from "react";\n\nexport function ExportHistory() {\n  const [showAll, setShowAll] = useStateLocal(false);')

# Replace exports.slice(0, 3).map with conditionally sliced mapping
map_logic = '''
          <div className="space-y-3">
            {exports.slice(0, showAll ? undefined : 3).map((item: ExportJob) => (
'''
content = content.replace('exports.slice(0, 3).map((item: ExportJob) => (', map_logic)

# Add "View All" button at the bottom of the list
end_logic = '''
            ))}
          </div>
'''
content = content.replace('            </div>\n          ))\n        )}', '            </div>\n' + end_logic + '        )}')

button_logic = '''
        )}
        {exports.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-neutral-500"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : View All ()}
          </Button>
        )}
      </CardContent>
'''
content = content.replace('        )}\n      </CardContent>', button_logic)

with open('apps/web/src/components/reports/export-history.tsx', 'w') as f:
    f.write(content)

print("Export history updated")
