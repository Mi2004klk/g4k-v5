"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent, AppIcon } from "@g4k/ui/components";
import { ProfileHeader } from "./components/profile-header";
import { ProfileStats } from "./components/profile-stats";
import { ProfileGeneralTab } from "./components/profile-general-tab";
import { ProfileSecurityTab } from "./components/profile-security-tab";
import { ProfilePreferencesTab } from "./components/profile-preferences-tab";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 page-padding max-w-[1200px] mx-auto font-sans w-full">
      {/* Top Section: Slim Profile Header & Compact Stats */}
      <div className="flex flex-col xl:flex-row gap-6 w-full items-start">
        <div className="flex-1 w-full">
          <ProfileHeader />
        </div>
        <div className="w-full xl:w-auto shrink-0">
          <ProfileStats />
        </div>
      </div>

      {/* Main Settings Area: Sidebar Tabs Layout */}
      <Tabs defaultValue="general" className="w-full flex flex-col md:flex-row gap-8 items-start mt-4">
        {/* Left Sidebar */}
        <TabsList className="flex flex-col w-full md:w-[240px] shrink-0 bg-transparent h-auto p-0 space-y-1">
          <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-3">
            Profile Settings
          </div>
          
          <TabsTrigger 
            value="general" 
            className="w-full justify-start gap-3 px-3 py-2.5 h-10 rounded-lg border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:border-neutral-200 dark:data-[state=active]:border-neutral-800 data-[state=active]:shadow-sm data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-400 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all font-medium"
          >
            <AppIcon name="profile" size="sm" /> General Info
          </TabsTrigger>
          
          <TabsTrigger 
            value="security" 
            className="w-full justify-start gap-3 px-3 py-2.5 h-10 rounded-lg border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:border-neutral-200 dark:data-[state=active]:border-neutral-800 data-[state=active]:shadow-sm data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-400 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all font-medium"
          >
            <AppIcon name="shield" size="sm" /> Security & Devices
          </TabsTrigger>
          
          <TabsTrigger 
            value="preferences" 
            className="w-full justify-start gap-3 px-3 py-2.5 h-10 rounded-lg border border-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:border-neutral-200 dark:data-[state=active]:border-neutral-800 data-[state=active]:shadow-sm data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-400 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all font-medium"
          >
            <AppIcon name="settings" size="sm" /> Preferences & Support
          </TabsTrigger>
        </TabsList>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <TabsContent value="general" className="mt-0 animate-in fade-in-50 duration-300">
            <ProfileGeneralTab />
          </TabsContent>
          <TabsContent value="security" className="mt-0 animate-in fade-in-50 duration-300">
            <ProfileSecurityTab />
          </TabsContent>
          <TabsContent value="preferences" className="mt-0 animate-in fade-in-50 duration-300">
            <ProfilePreferencesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
