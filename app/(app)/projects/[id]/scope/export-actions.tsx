"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExportActionsProps {
  projectId: string;
}

/**
 * Client component with download (PDF/DOCX) and email send buttons.
 */
export function ExportActions({ projectId }: ExportActionsProps) {
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);

  async function handleEmail() {
    setSending(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/export/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailResult(data.message ?? "Email enviado com sucesso!");
      } else {
        setEmailResult(data.error ?? "Erro ao enviar email.");
      }
    } catch {
      setEmailResult("Falha na conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <a href={`/api/export/pdf?projectId=${projectId}`} download>
        <Button variant="default" className="bg-perma-green hover:bg-perma-green/90">
          Baixar PDF
        </Button>
      </a>

      <a href={`/api/export/docx?projectId=${projectId}`} download>
        <Button variant="outline">
          Baixar DOCX
        </Button>
      </a>

      <Button
        variant="outline"
        onClick={handleEmail}
        disabled={sending}
      >
        {sending ? "Enviando..." : "Enviar por email"}
      </Button>

      {emailResult && (
        <span className="text-sm text-muted-foreground">{emailResult}</span>
      )}
    </div>
  );
}
