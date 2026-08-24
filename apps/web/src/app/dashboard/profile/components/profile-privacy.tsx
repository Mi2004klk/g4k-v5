"use client";

import { AppIcon } from "@g4k/ui/components";
import { Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@g4k/ui/components";

export function ProfilePrivacySection() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="shield" className="text-slate-500 w-5 h-5" />
            Privacy & Visibility
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Control who can see your profile information.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-0 sm:pl-7">
          {/* Profile Visibility */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Profile Visibility</label>
            <div className="relative">
              <Select defaultValue="all">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  <SelectItem value="department">My Department Only</SelectItem>
                  <SelectItem value="managers">Managers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Contact Information</label>
            <div className="relative">
              <Select defaultValue="all">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  <SelectItem value="department">My Department Only</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
