"use client";

import { SettingsTabs } from "@/components/settings/settings-tabs";
import { ErrorBoundary } from "@g4k/ui/components";
import { PageContainer } from "@/components/layout/page-container";

export default function SettingsPage() {
  return (
    <PageContainer
      title="System Settings"
      description="Manage company profile, security policies, and global configuration."
      maxWidth="readable"
    >
      <ErrorBoundary>
        <SettingsTabs />
      </ErrorBoundary>
    </PageContainer>
  );
}
