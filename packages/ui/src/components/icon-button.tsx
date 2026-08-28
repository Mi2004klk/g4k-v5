"use client";

import * as React from "react";
import { Button, ButtonProps } from "./button";
import { AppIcon } from "./icon/AppIcon";
import { IconName } from "./icon/registry";

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: IconName;
  "aria-label": string; // Enforce accessibility for icon buttons
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, "aria-label": ariaLabel, size = "icon", variant = "ghost", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        aria-label={ariaLabel}
        {...props}
      >
        <AppIcon name={icon} />
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";
