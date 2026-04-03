"use client";

import { type FormEvent, useState } from "react";
import type { JoinField } from "@/lib/engine/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface JoinFormProps {
  fields: JoinField[];
  partyCode?: string;
  variant?: "join" | "host";
  onSubmit: (name: string, data: Record<string, unknown>) => void;
  loading?: boolean;
  onBack?: () => void;
}

export function JoinForm({
  fields,
  partyCode,
  variant = "join",
  onSubmit,
  loading,
  onBack,
}: JoinFormProps) {
  const [name, setName] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const field of fields) {
      defaults[field.name] = field.defaultValue || "";
    }
    return defaults;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isHost = variant === "host";
  const submitLabel = isHost
    ? loading
      ? "Creating…"
      : "Create party"
    : loading
      ? "Joining…"
      : "Join Game";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(name.trim(), formData);
  }

  function updateField(fieldName: string, value: string) {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-1">
          Tap In
        </p>
        {isHost ? (
          <>
            <h2 className="text-xl font-bold text-gray-900">Your profile</h2>
            <p className="text-gray-500 text-sm mt-1">
              How you&apos;ll appear in the lobby. You&apos;ll get a party code
              after this step.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Join a party</h2>
            <p className="text-gray-500">
              Party code{" "}
              <span className="font-mono font-bold tracking-wider text-violet-600">
                {partyCode}
              </span>
            </p>
          </>
        )}
      </div>

      <Input
        label="Your name"
        name="name"
        placeholder="Enter your name"
        value={name}
        maxLength={16}
        onChange={(e) => {
          setName(e.target.value.slice(0, 16));
          setErrors((prev) => {
            const next = { ...prev };
            delete next.name;
            return next;
          });
        }}
        error={errors.name}
        required
        autoFocus
      />

      {fields.map((field) => {
        if (field.type === "select" && field.options) {
          return (
            <Select
              key={field.name}
              label={field.label}
              name={field.name}
              options={field.options}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={(e) => updateField(field.name, e.target.value)}
              error={errors[field.name]}
              required={field.required}
            />
          );
        }

        return (
          <Input
            key={field.name}
            label={field.label}
            name={field.name}
            type={field.type === "number" ? "number" : "text"}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={(e) => updateField(field.name, e.target.value)}
            error={errors[field.name]}
            required={field.required}
          />
        );
      })}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {submitLabel}
      </Button>

      {isHost && onBack && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={onBack}
        >
          Back to games
        </Button>
      )}
    </form>
  );
}
