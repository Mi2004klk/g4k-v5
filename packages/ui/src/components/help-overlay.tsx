"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { CommandShortcut } from "./command"

const SHORTCUTS = [
  {
    category: "Global Navigation",
    items: [
      { keys: ["⌘", "K"], description: "Open Command Menu" },
      { keys: ["⌘", "B"], description: "Toggle Sidebar" },
      { keys: ["⌘", "/"], description: "Show Keyboard Shortcuts" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["⌘", "N"], description: "Create New Item" },
      { keys: ["⌘", "S"], description: "Save Changes / Draft" },
      { keys: ["Enter"], description: "Submit Form / Inline Edit" },
      { keys: ["Esc"], description: "Cancel / Close Dialog" },
    ],
  },
]

export function HelpOverlay() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle on Ctrl+/ or Cmd+/
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {SHORTCUTS.map((group) => (
            <div key={group.category} className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {group.category}
              </h4>
              <div className="space-y-2">
                {group.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
