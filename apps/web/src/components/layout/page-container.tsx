import React from "react";


export interface PageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  filterBar?: React.ReactNode;
}

export function PageContainer({ title, description, children, actions, filterBar }: PageContainerProps) {
  return (
    <div className="flex flex-col gap-page-sections page-padding">
      <div className="flex flex-col gap-4">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
            {title}
          </h1>
          {description && <p className="text-xs text-neutral-500">{description}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
      </div>
      
      {filterBar && (
        <div className="filter-gap">
          {filterBar}
        </div>
      )}
      
      <div className="flex-1 w-full flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
