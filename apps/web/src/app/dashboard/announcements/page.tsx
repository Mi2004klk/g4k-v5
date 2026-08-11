"use client";

import { PageContainer } from "@/components/layout/page-container";
import { AnnouncementBoard } from "@/components/widgets/announcement-board";

export default function AnnouncementsPage() {
  return (
    <PageContainer title="Company Announcements">
      <div className="max-w-4xl">
        <AnnouncementBoard />
      </div>
    </PageContainer>
  );
}
