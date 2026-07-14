-- 0002_account_deletions.sql
-- Tabela de auditoria anonimizada para exclusões de conta (LGPD).

CREATE TABLE public.account_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,  -- SHA-256 do email (sem PII)
  deleted_at timestamptz NOT NULL DEFAULT now(),
  reason text DEFAULT 'user_request'
);

-- RLS: ninguém acessa via API (somente o backend com service_role)
ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy para anon/authenticated — a tabela só é acessível via service_role
