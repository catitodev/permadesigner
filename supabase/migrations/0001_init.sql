-- =============================================================================
-- 0001_init.sql — Schema inicial do Companheiro de Design em Permacultura
-- Cria todas as tabelas, triggers e políticas RLS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tabela: users
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  theme_preference text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tabela: projects
-- ---------------------------------------------------------------------------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_stage_id text,
  completeness_status text NOT NULL DEFAULT 'initial',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);

-- ---------------------------------------------------------------------------
-- Tabela: conversation_messages
-- ---------------------------------------------------------------------------
CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  stage_id text,
  grounding_refs jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_messages_project_id ON public.conversation_messages(project_id);

-- ---------------------------------------------------------------------------
-- Tabela: stage_responses
-- ---------------------------------------------------------------------------
CREATE TABLE public.stage_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id text NOT NULL,
  field_key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, stage_id, field_key)
);

CREATE INDEX idx_stage_responses_project_id ON public.stage_responses(project_id);

-- ---------------------------------------------------------------------------
-- Tabela: nature_observations
-- ---------------------------------------------------------------------------
CREATE TABLE public.nature_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  observation text NOT NULL,
  design_implication text NOT NULL,
  related_principle_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nature_observations_project_id ON public.nature_observations(project_id);

-- ---------------------------------------------------------------------------
-- Tabela: project_attachments
-- ---------------------------------------------------------------------------
CREATE TABLE public.project_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  linked_category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_attachments_project_id ON public.project_attachments(project_id);

-- ---------------------------------------------------------------------------
-- Tabela: scope_documents
-- ---------------------------------------------------------------------------
CREATE TABLE public.scope_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version int NOT NULL,
  status text NOT NULL DEFAULT 'initial' CHECK (status IN ('initial', 'complete')),
  content jsonb NOT NULL DEFAULT '{}',
  pdf_storage_path text,
  docx_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scope_documents_project_id ON public.scope_documents(project_id);

-- ===========================================================================
-- TRIGGERS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Trigger: auto-create user row on auth.users insert (after sign-up)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: auto-update projects.updated_at on any change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ===========================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- RLS: users — SELECT/UPDATE own row only
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: projects — ALL operations where user_id = auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: conversation_messages — via JOIN to projects
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their own projects"
  ON public.conversation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = conversation_messages.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into their own projects"
  ON public.conversation_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = conversation_messages.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages of their own projects"
  ON public.conversation_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = conversation_messages.project_id
        AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = conversation_messages.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages of their own projects"
  ON public.conversation_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = conversation_messages.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: stage_responses — via JOIN to projects
-- ---------------------------------------------------------------------------
ALTER TABLE public.stage_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stage responses of their own projects"
  ON public.stage_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stage_responses.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert stage responses into their own projects"
  ON public.stage_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stage_responses.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stage responses of their own projects"
  ON public.stage_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stage_responses.project_id
        AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stage_responses.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stage responses of their own projects"
  ON public.stage_responses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = stage_responses.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: nature_observations — via JOIN to projects
-- ---------------------------------------------------------------------------
ALTER TABLE public.nature_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nature observations of their own projects"
  ON public.nature_observations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = nature_observations.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert nature observations into their own projects"
  ON public.nature_observations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = nature_observations.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nature observations of their own projects"
  ON public.nature_observations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = nature_observations.project_id
        AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = nature_observations.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete nature observations of their own projects"
  ON public.nature_observations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = nature_observations.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: project_attachments — via JOIN to projects
-- ---------------------------------------------------------------------------
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of their own projects"
  ON public.project_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_attachments.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments into their own projects"
  ON public.project_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_attachments.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attachments of their own projects"
  ON public.project_attachments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_attachments.project_id
        AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_attachments.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments of their own projects"
  ON public.project_attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_attachments.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: scope_documents — via JOIN to projects
-- ---------------------------------------------------------------------------
ALTER TABLE public.scope_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scope documents of their own projects"
  ON public.scope_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_documents.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scope documents into their own projects"
  ON public.scope_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_documents.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scope documents of their own projects"
  ON public.scope_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_documents.project_id
        AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_documents.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scope documents of their own projects"
  ON public.scope_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = scope_documents.project_id
        AND projects.user_id = auth.uid()
    )
  );
