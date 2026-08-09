"use client";

import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage company profile, security policies, and global configuration.</p>
      </div>

      <SettingsTabs />
    </div>
  );
}
