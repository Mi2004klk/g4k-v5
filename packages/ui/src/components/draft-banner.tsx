import React from "react"
import { Button } from "./button"
import { AppIcon } from "./icon/AppIcon"

export interface DraftBannerProps {
  hasDraft: boolean
  onRestore: () => void
  onDiscard: () => void
}

export function DraftBanner({ hasDraft, onRestore, onDiscard }: DraftBannerProps) {
  if (!hasDraft) return null

  return (
    <div className="flex items-center justify-between p-3 mb-4 rounded-xl border border-info/20 bg-info/5 text-info text-sm">
      <div className="flex items-center gap-2 font-medium">
        <AppIcon name="info" size="sm" />
        You have an unsaved draft. Continue editing?
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onDiscard} className="h-7 text-xs border-info/30 hover:bg-info/10">
          Discard
        </Button>
        <Button size="sm" onClick={onRestore} className="h-7 text-xs bg-info hover:bg-info/90 text-white">
          Restore
        </Button>
      </div>
    </div>
  )
}
