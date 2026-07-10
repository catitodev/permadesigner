"use client";

/**
 * FallbackForm — structured form rendered when AI providers are unavailable.
 *
 * Shows the FallbackQuestion[] for the current stage as a form with text inputs,
 * textareas, and selects. Submit saves responses via the /api/fallback-response endpoint.
 *
 * Requirements: 4.7, 8.2
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FallbackQuestion } from "../fallback-form";

interface FallbackFormProps {
  questions: FallbackQuestion[];
  stageId: string;
  projectId: string;
  onSubmit: (responses: Record<string, string>) => void;
  isSubmitting?: boolean;
}

export function FallbackForm({
  questions,
  stageId,
  projectId,
  onSubmit,
  isSubmitting = false,
}: FallbackFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.fieldKey, ""])),
  );

  const handleChange = (fieldKey: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const allRequiredFilled = questions
    .filter((q) => q.required)
    .every((q) => values[q.fieldKey]?.trim());

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-4"
      aria-label={`Formulário estruturado — ${stageId}`}
    >
      <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <p className="font-medium">Modo formulário</p>
        <p className="mt-0.5 text-xs">
          O assistente de IA está temporariamente indisponível. Preencha as
          perguntas abaixo para continuar.
        </p>
      </div>

      {questions.map((question) => (
        <div key={question.fieldKey} className="space-y-1.5">
          <label
            htmlFor={`${projectId}-${stageId}-${question.fieldKey}`}
            className={cn(
              "block text-sm font-medium",
              question.required && "after:ml-0.5 after:text-destructive after:content-['*']",
            )}
          >
            {question.label}
          </label>

          {question.inputType === "textarea" && (
            <textarea
              id={`${projectId}-${stageId}-${question.fieldKey}`}
              value={values[question.fieldKey] ?? ""}
              onChange={(e) => handleChange(question.fieldKey, e.target.value)}
              placeholder={question.placeholder}
              required={question.required}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-required={question.required}
            />
          )}

          {question.inputType === "text" && (
            <Input
              id={`${projectId}-${stageId}-${question.fieldKey}`}
              value={values[question.fieldKey] ?? ""}
              onChange={(e) => handleChange(question.fieldKey, e.target.value)}
              placeholder={question.placeholder}
              required={question.required}
              aria-required={question.required}
            />
          )}

          {question.inputType === "select" && question.options && (
            <select
              id={`${projectId}-${stageId}-${question.fieldKey}`}
              value={values[question.fieldKey] ?? ""}
              onChange={(e) => handleChange(question.fieldKey, e.target.value)}
              required={question.required}
              aria-required={question.required}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              {question.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      <Button
        type="submit"
        disabled={!allRequiredFilled || isSubmitting}
        className="w-full bg-perma-teal hover:bg-perma-teal/90"
        aria-label="Enviar respostas do formulário"
      >
        {isSubmitting ? "Salvando..." : "Salvar respostas"}
      </Button>
    </form>
  );
}
