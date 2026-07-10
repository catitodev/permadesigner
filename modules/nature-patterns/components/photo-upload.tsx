"use client";

/**
 * PhotoUpload — allows attaching photos to a nature-pattern category.
 * Validates type/size client-side, uploads via /api/upload.
 * Requirements: 5.3
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  projectId: string;
  category: string;
  onUploaded?: (storagePath: string) => void;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp";

export function PhotoUpload({ projectId, category, onUploaded }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    if (file.size > MAX_SIZE) {
      setError("Arquivo muito grande. Máximo: 5MB.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("projectId", projectId);
    formData.set("category", category);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        onUploaded?.(data.storagePath);
      } else {
        setError(data.error ?? "Erro no upload.");
      }
    } catch {
      setError("Falha na conexão. Tente novamente.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFileChange}
        className="hidden"
        id={`upload-${category}`}
        aria-label={`Anexar foto para ${category}`}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Enviando..." : "📷 Anexar foto"}
      </Button>

      {error && <span className="text-xs text-destructive">{error}</span>}
      {success && <span className="text-xs text-perma-green">✓ Foto anexada</span>}
    </div>
  );
}
