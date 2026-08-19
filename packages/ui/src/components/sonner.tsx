"use client"

import { AppIcon } from "./icon/AppIcon";
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      duration={4000}
      richColors
      icons={{
        success: <AppIcon name="success" />,
        info: <AppIcon name="info" />,
        warning: <AppIcon name="warning" />,
        error: <AppIcon name="error" />,
        loading: <AppIcon name="loading" className=" animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-e3",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:border-border hover:group-[.toast]:bg-muted-foreground/10",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
