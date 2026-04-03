"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="font-headline font-bold text-sm uppercase tracking-tight pl-1 text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 border-4 border-foreground
            rounded-tl-lg rounded-br-lg rounded-tr-[24px] rounded-bl-[24px]
            text-foreground font-body font-semibold
            placeholder:text-outline-variant
            bg-surface-lowest
            focus:outline-none focus:border-secondary
            focus:-translate-y-0.5 focus:-translate-x-0.5
            focus:shadow-[4px_4px_0px_0px_#006970]
            transition-all duration-150
            ${error ? "border-error shadow-[4px_4px_0px_0px_#ba1a1a]" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm font-label font-bold text-error pl-1">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
