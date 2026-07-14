-- 0003_user_integrations.sql
-- Stores encrypted OAuth tokens for external integrations (Google Drive).

CREATE TABLE public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  encrypted_tokens text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_integrations_user_id ON public.user_integrations(user_id);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON public.user_integrations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own integrations"
  ON public.user_integrations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own integrations"
  ON public.user_integrations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations"
  ON public.user_integrations
  FOR DELETE
  USING (user_id = auth.uid());
