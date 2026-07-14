"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

/**
 * Two-step account deletion confirmation.
 * Req: AP-4 (exclusão de conta)
 */
export function DeleteAccountSection() {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok) {
        router.push("/login?deleted=true");
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao excluir conta.");
        setDeleting(false);
      }
    } catch {
      setError("Falha na conexão.");
      setDeleting(false);
    }
  }

  if (step === 1) {
    return (
      <Button
        variant="destructive"
        onClick={() => setStep(2)}
      >
        Excluir minha conta
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-destructive font-medium">
        Digite EXCLUIR para confirmar:
      </p>
      <Input
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        placeholder="EXCLUIR"
      />
      <div className="flex gap-2">
        <Button
          variant="destructive"
          disabled={confirmation !== "EXCLUIR" || deleting}
          onClick={handleDelete}
        >
          {deleting ? "Excluindo..." : "Confirmar exclusão"}
        </Button>
        <Button variant="outline" onClick={() => { setStep(1); setConfirmation(""); }}>
          Cancelar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
