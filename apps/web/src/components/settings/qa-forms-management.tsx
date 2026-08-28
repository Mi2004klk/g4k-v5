"use client";

import { QAFormBuilder } from "@/components/tasks/qa-form-builder";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";

export function QaFormsManagement() {
  return (
    <Card className="bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-[800px] flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle className="text-base">QA Forms Management</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <QAFormBuilder />
      </CardContent>
    </Card>
  );
}
