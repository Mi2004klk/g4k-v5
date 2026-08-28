import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

const inputVariants = cva(
  "flex h-10 rounded-xl border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-destructive focus-visible:ring-destructive",
      },
      inputSize: {
        xs: "w-full max-w-[6rem]",
        sm: "w-full max-w-[10rem]",
        md: "w-full max-w-[16rem]",
        lg: "w-full max-w-[24rem]",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "full",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(inputVariants({ variant: error ? "error" : variant, inputSize, className }))}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
