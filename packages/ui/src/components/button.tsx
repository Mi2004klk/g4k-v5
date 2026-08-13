import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-120 active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        success: "bg-success text-white hover:bg-success/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-full px-3",
        lg: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const RainbowBorder = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative inline-flex rounded-full p-[1px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_15px_rgba(20,20,28,0.18)]",
          className
        )}
        {...props}
      >
        <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3B82F6_0%,#14B8A6_25%,#F97316_50%,#EF4444_75%,#3B82F6_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:hidden" />
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:opacity-100 hidden motion-reduce:block" />
        <div className="relative inline-flex h-full w-full rounded-md bg-primary">
          {children}
        </div>
      </div>
    );
  }
);
RainbowBorder.displayName = "RainbowBorder";

export const DotLoader = () => (
  <span className="flex items-center justify-center gap-1">
    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
  </span>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))}
              ref={ref as any} {...props}>
          {children}
        </Slot>
      );
    }
    
    const content = (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref}
              disabled={isLoading || disabled} {...props}>
        {isLoading && <span className="absolute inset-0 flex items-center justify-center"><DotLoader/></span>}
        <span className={cn("inline-flex items-center gap-2", isLoading && "opacity-0")}>{children}</span>
      </button>
    );

    if (variant === "primary" && size === "lg" && !asChild) {
      return (
        <RainbowBorder>
          {content}
        </RainbowBorder>
      );
    }

    return content;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, RainbowBorder };
