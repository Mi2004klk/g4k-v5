"use client";

import * as React from "react";
import { Button, ButtonProps } from "./button";
import { AppIcon } from "./icon/AppIcon";

export interface ExportButtonProps extends ButtonProps {
  onExport: () => Promise<void> | void;
  isLoading?: boolean;
}

export function ExportButton({
  onExport,
  isLoading,
  disabled,
  children = "Export",
  variant = "outline",
  size = "sm",
  className,
  ...props
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isExporting || isLoading || disabled) return;
    
    try {
      setIsExporting(true);
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  const loading = isLoading || isExporting;

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={handleExport}
      className={className}
      {...props}
    >
      {loading ? (
        <AppIcon name="loading" className="mr-2 motion-safe:animate-spin" />
      ) : (
        <AppIcon name="download" className="mr-2" />
      )}
      {children}
    </Button>
  );
}
