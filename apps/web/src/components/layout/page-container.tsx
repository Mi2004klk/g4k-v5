import React from "react";


interface PageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageContainer({ title, description, children, actions }: PageContainerProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
            {title}
          </h1>
          {description && <p className="text-xs text-neutral-500">{description}</p>}
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
