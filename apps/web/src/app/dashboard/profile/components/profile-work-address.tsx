"use client";

import { AppIcon } from "@g4k/ui/components";
import { Card, Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Badge } from "@g4k/ui/components";

export function ProfileWorkAddressSection() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AppIcon name="building" className="text-fuchsia-500 w-5 h-5" />
              Work Address
            </h2>
            <Badge variant="secondary" className="bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-900/30 px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider">
              Not Verified
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 pl-7">Manage your official work location.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-0 sm:pl-7">
          {/* Location Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Work Location Type</label>
            <div className="relative">
              <Select defaultValue="office" disabled>
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4 cursor-not-allowed text-neutral-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Work Address */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Work Address</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <AppIcon name="map" className="w-4 h-4" />
              </div>
              <Input 
                value="YouTube Office, Chennai, India" 
                readOnly
                className="h-11 text-sm pl-9 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed border-neutral-200 dark:border-neutral-800 rounded-xl" 
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            className="border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-5 h-10 rounded-xl text-xs font-bold transition-all"
          >
            Edit Address
          </Button>
        </div>
      </Card>
    </div>
  );
}
