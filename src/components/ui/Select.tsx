"use client";

import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={selectId}
            className="font-headline font-bold text-sm uppercase tracking-tight pl-1 text-foreground"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-4 py-3 border-4 border-foreground appearance-none
            rounded-tr-lg rounded-bl-lg rounded-tl-[24px] rounded-br-[24px]
            text-foreground font-body font-semibold
            bg-surface-lowest
            focus:outline-none focus:border-tertiary
            focus:-translate-y-0.5 focus:-translate-x-0.5
            focus:shadow-[4px_4px_0px_0px_#506600]
            transition-all duration-150
            ${error ? "border-error shadow-[4px_4px_0px_0px_#ba1a1a]" : ""}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm font-label font-bold text-error pl-1">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
