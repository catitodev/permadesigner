"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { createProject } from "./actions";

interface FormValues {
  name: string;
}

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", values.name);

    const result = await createProject(formData);

    // If createProject succeeds it will redirect, so we only reach here on error
    if (result?.error) {
      setServerError(result.error);
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
      setServerError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button size="lg" />}
      >
        <PlusIcon data-icon="inline-start" />
        Novo Projeto
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo projeto</DialogTitle>
          <DialogDescription>
            Dê um nome ao seu projeto de permacultura. Você poderá alterar
            depois.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              Nome do projeto
            </label>
            <Input
              id="project-name"
              placeholder="Ex.: Sítio dos Sonhos"
              aria-invalid={!!errors.name}
              {...register("name", {
                required: "Nome é obrigatório",
                minLength: {
                  value: 3,
                  message: "Mínimo 3 caracteres",
                },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
            {serverError && (
              <p className="text-xs text-destructive">{serverError}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
