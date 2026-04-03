"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white border-4 border-foreground shadow-[6px_6px_0px_0px_#3f0019] hover:-translate-y-0.5 active:translate-y-1 active:translate-x-1 active:shadow-none",
  secondary:
    "bg-surface-lowest text-foreground border-4 border-foreground shadow-[4px_4px_0px_0px_#006970] hover:-translate-y-0.5 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none",
  ghost:
    "text-foreground hover:bg-surface-high active:bg-surface-highest",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm wobbly-br-2",
  md: "px-5 py-3 text-base wobbly-br-1",
  lg: "px-8 py-4 text-lg wobbly-br-1",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center
          font-headline font-bold uppercase tracking-wider
          transition-all duration-150 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-0 disabled:active:shadow-[6px_6px_0px_0px_#3f0019]
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
