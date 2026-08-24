"use client";

import { AppIcon } from "@g4k/ui/components";
import { Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@g4k/ui/components";

export function ProfileAccountSection() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <AppIcon name="settings" className="text-blue-500 w-5 h-5" />
            Account Preferences
          </h2>
          <p className="text-xs text-neutral-500 mt-1 pl-7">Manage your language and regional settings.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 sm:pl-7">
          {/* Language */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Language</label>
            <div className="relative">
              <Select defaultValue="en">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Time Zone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Time Zone</label>
            <div className="relative">
              <Select defaultValue="ist">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="est">America/New_York (EST)</SelectItem>
                  <SelectItem value="pst">America/Los_Angeles (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white">Date Format</label>
            <div className="relative">
              <Select defaultValue="ddmmyyyy">
                <SelectTrigger className="h-11 text-sm bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 rounded-xl px-4">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
