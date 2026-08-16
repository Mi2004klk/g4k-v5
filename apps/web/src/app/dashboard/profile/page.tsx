"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@g4k/ui/components";
import { ProfileHeader } from "./components/profile-header";
import { ProfileStats } from "./components/profile-stats";
import { ProfileGeneralTab } from "./components/profile-general-tab";
import { ProfileSecurityTab } from "./components/profile-security-tab";
import { ProfilePreferencesTab } from "./components/profile-preferences-tab";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-page-sections page-padding max-w-5xl mx-auto font-sans w-full">
      <ProfileHeader />
      <ProfileStats />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto overflow-y-hidden border-b border-border rounded-none bg-transparent p-0 thin-scrollbar pb-px h-auto">
          <TabsTrigger 
            value="general" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-violet data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-3"
          >
            General Info
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-violet data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-3"
          >
            Security & Devices
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-violet data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-3"
          >
            Preferences & Support
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-0 animate-in fade-in-50 duration-300">
          <ProfileGeneralTab />
        </TabsContent>
        <TabsContent value="security" className="mt-0 animate-in fade-in-50 duration-300">
          <ProfileSecurityTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-0 animate-in fade-in-50 duration-300">
          <ProfilePreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
