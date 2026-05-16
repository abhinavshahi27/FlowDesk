-- =========================================================================
-- FlowDesk full schema fix-up (idempotent)
-- Paste this ENTIRE file into Supabase SQL Editor and click Run.
-- Safe to run multiple times. Only adds missing pieces; nothing is dropped
-- except policies (which are immediately recreated).
-- =========================================================================

-- 1. CREATE TABLES IF THEY DON'T EXIST -----------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- 2. ADD MISSING COLUMNS -------------------------------------------------

-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- project_members
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();
DO $$ BEGIN
  ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_user_id_key UNIQUE (project_id, user_id);
EXCEPTION WHEN duplicate_table THEN NULL;
WHEN duplicate_object THEN NULL;
END $$;

-- tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position int DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- activity_log
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS action text NOT NULL DEFAULT '';
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'task';
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS entity_id uuid;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}';
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. CHECK CONSTRAINTS (drop & recreate idempotently) ---------------------

ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check;
ALTER TABLE project_members ADD CONSTRAINT project_members_role_check
  CHECK (role IN ('admin', 'member'));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done'));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- 4. ENABLE RLS ----------------------------------------------------------

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;

-- 5. INDEXES -------------------------------------------------------------

CREATE INDEX IF NOT EXISTS tasks_project_id_idx        ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx       ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_status_idx            ON tasks(status);
CREATE INDEX IF NOT EXISTS activity_log_project_id_idx ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS activity_log_user_id_idx    ON activity_log(user_id);

-- 6. HELPER FUNCTIONS ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_project_owner(
  target_project_id uuid,
  target_user_id uuid DEFAULT auth.uid()
) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = target_project_id AND owner_id = target_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(
  target_project_id uuid,
  target_user_id uuid DEFAULT auth.uid()
) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members WHERE project_id = target_project_id AND user_id = target_user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_project_admin(
  target_project_id uuid,
  target_user_id uuid DEFAULT auth.uid()
) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members WHERE project_id = target_project_id AND user_id = target_user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'admin';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_member_task_detail_edits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_project_admin(OLD.project_id) OR public.is_project_owner(OLD.project_id) THEN
    RETURN NEW;
  END IF;
  IF OLD.assigned_to = auth.uid() THEN
    IF NEW.project_id IS DISTINCT FROM OLD.project_id
      OR NEW.title IS DISTINCT FROM OLD.title
      OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.priority IS DISTINCT FROM OLD.priority
      OR NEW.due_date IS DISTINCT FROM OLD.due_date
      OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
      OR NEW.created_by IS DISTINCT FROM OLD.created_by
      OR NEW.tags IS DISTINCT FROM OLD.tags THEN
      RAISE EXCEPTION 'Members can only update status and position for assigned tasks';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Members can only update assigned tasks';
END;
$$;

-- 7. TRIGGERS ------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_project();

DROP TRIGGER IF EXISTS enforce_member_task_detail_edits ON public.tasks;
CREATE TRIGGER enforce_member_task_detail_edits
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_member_task_detail_edits();

-- 8. POLICIES (drop all, then recreate) ----------------------------------

-- profiles
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- projects
DROP POLICY IF EXISTS "Project members can view project" ON projects;
CREATE POLICY "Project members can view project"
  ON projects FOR SELECT TO authenticated
  USING (public.is_project_member(id) OR public.is_project_owner(id));

DROP POLICY IF EXISTS "Project owners can view own project" ON projects;
CREATE POLICY "Project owners can view own project"
  ON projects FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Project admins can update project" ON projects;
CREATE POLICY "Project admins can update project"
  ON projects FOR UPDATE TO authenticated
  USING (public.is_project_admin(id) OR public.is_project_owner(id))
  WITH CHECK (public.is_project_admin(id) OR public.is_project_owner(id));

DROP POLICY IF EXISTS "Project admins can delete project" ON projects;
CREATE POLICY "Project admins can delete project"
  ON projects FOR DELETE TO authenticated
  USING (public.is_project_admin(id) OR public.is_project_owner(id));

-- project_members
DROP POLICY IF EXISTS "Project members can view members" ON project_members;
CREATE POLICY "Project members can view members"
  ON project_members FOR SELECT TO authenticated
  USING (public.is_project_member(project_id) OR public.is_project_owner(project_id));

DROP POLICY IF EXISTS "Allow self or admin to insert members" ON project_members;
DROP POLICY IF EXISTS "Project admins can insert members" ON project_members;
CREATE POLICY "Project admins can insert members"
  ON project_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_project_admin(project_id)
    OR public.is_project_owner(project_id)
  );

DROP POLICY IF EXISTS "Project admins can delete members" ON project_members;
CREATE POLICY "Project admins can delete members"
  ON project_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_project_admin(project_id)
    OR public.is_project_owner(project_id)
  );

-- tasks
DROP POLICY IF EXISTS "Project members can view tasks" ON tasks;
CREATE POLICY "Project members can view tasks"
  ON tasks FOR SELECT TO authenticated
  USING (public.is_project_member(project_id) OR public.is_project_owner(project_id));

DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Project admins can create tasks" ON tasks;
CREATE POLICY "Project admins can create tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (public.is_project_admin(project_id) OR public.is_project_owner(project_id))
  );

DROP POLICY IF EXISTS "Project members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admins update any task, members update assigned task" ON tasks;
CREATE POLICY "Admins update any task, members update assigned task"
  ON tasks FOR UPDATE TO authenticated
  USING (
    public.is_project_admin(project_id)
    OR public.is_project_owner(project_id)
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    public.is_project_admin(project_id)
    OR public.is_project_owner(project_id)
    OR assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "Task creator or admin can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Project admins can delete tasks" ON tasks;
CREATE POLICY "Project admins can delete tasks"
  ON tasks FOR DELETE TO authenticated
  USING (public.is_project_admin(project_id) OR public.is_project_owner(project_id));

-- activity_log
DROP POLICY IF EXISTS "Project members can view activity" ON activity_log;
CREATE POLICY "Project members can view activity"
  ON activity_log FOR SELECT TO authenticated
  USING (
    project_id IS NULL
    OR public.is_project_member(project_id)
    OR public.is_project_owner(project_id)
  );

DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_log;
CREATE POLICY "Authenticated users can insert activity"
  ON activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 9. BACKFILL ------------------------------------------------------------

-- Make sure every existing project owner has an admin membership row.
INSERT INTO public.project_members (project_id, user_id, role)
SELECT id, owner_id, 'admin'
FROM public.projects
WHERE owner_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'admin';

-- Make sure every existing auth user has a profiles row.
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', ''), COALESCE(u.email, '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 10. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE ----------------------------

NOTIFY pgrst, 'reload schema';
