"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import Image from "next/image"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils/cn"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  children?: React.ReactNode;
  className?: string;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & { src?: string; alt?: string }
>(({ className, src, alt, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    asChild
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  >
    {src ? (
      <Image src={src} alt={alt || ""} fill sizes="96px" className="object-cover" />
    ) : (
      <img src="" alt={alt || ""} />
    )}
  </AvatarPrimitive.Image>
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const accentColors = [
  "bg-accent-violet text-white",
  "bg-accent-blue text-white",
  "bg-accent-cyan text-white",
  "bg-accent-teal text-white",
  "bg-accent-green text-white",
  "bg-accent-orange text-white",
  "bg-accent-red text-white",
  "bg-accent-pink text-white",
];

function getHashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return accentColors[Math.abs(hash) % accentColors.length];
}

export function getInitials(name: string): string {
  if (!name) return "UI";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  name?: string;
  children?: React.ReactNode;
  className?: string;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, name, children, ...props }, ref) => {
  const bgColorClass = name ? getHashColor(name) : "bg-muted text-muted-foreground";
  
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full text-xs font-medium uppercase",
        bgColorClass,
        className
      )}
      {...props}
    >
      {children || (name ? getInitials(name) : "UI")}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number;
}

function AvatarGroup({ className, children, limit = 4, ...props }: AvatarGroupProps) {
  const avatars = React.Children.toArray(children);
  const visibleAvatars = avatars.slice(0, limit);
  const overflowCount = Math.max(0, avatars.length - limit);

  return (
    <div className={cn("flex items-center -space-x-2", className)} {...props}>
      {visibleAvatars.map((avatar, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          {avatar}
        </div>
      ))}
      {overflowCount > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-background bg-muted text-muted-foreground text-xs font-medium z-10">
          +{overflowCount}
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup }
