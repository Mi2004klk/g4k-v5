import React from "react";
import { Breadcrumb } from "@/components/app-shell/breadcrumb";

interface PageContainerProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export function PageContainer({ title, children, actions, breadcrumbs }: PageContainerProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          {breadcrumbs || <Breadcrumb />}
          <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
}
