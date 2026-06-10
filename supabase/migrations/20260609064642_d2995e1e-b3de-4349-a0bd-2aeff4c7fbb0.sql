
-- Enum for availability/networking status
CREATE TYPE public.networking_status AS ENUM (
  'open_to_networking',
  'open_to_mentorship',
  'looking_for_collaborators',
  'busy',
  'not_accepting'
);

CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.coffee_chat_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');
CREATE TYPE public.coffee_purpose AS ENUM ('mentorship', 'career_guidance', 'startup_discussion', 'collaboration', 'networking');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  career_goals TEXT NOT NULL DEFAULT '',
  offering_skills TEXT[] NOT NULL DEFAULT '{}',
  seeking_skills TEXT[] NOT NULL DEFAULT '{}',
  status public.networking_status NOT NULL DEFAULT 'open_to_networking',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CONNECTIONS
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.connection_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_connect CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conn_select_involved" ON public.connections FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "conn_insert_self" ON public.connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "conn_update_addressee" ON public.connections FOR UPDATE TO authenticated USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "conn_delete_involved" ON public.connections FOR DELETE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE TRIGGER connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- helper: are two users connected
CREATE OR REPLACE FUNCTION public.are_connected(a UUID, b UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
    AND ((requester_id = a AND addressee_id = b) OR (requester_id = b AND addressee_id = a))
  );
$$;

-- MESSAGES (1:1 direct messaging)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX messages_recipient_idx ON public.messages (recipient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select_involved" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "msg_insert_connected" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.are_connected(sender_id, recipient_id));
CREATE POLICY "msg_update_recipient" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- COFFEE CHATS
CREATE TABLE public.coffee_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL CHECK (duration_minutes IN (15, 30, 45)),
  purpose public.coffee_purpose NOT NULL,
  proposed_time TIMESTAMPTZ,
  message TEXT,
  status public.coffee_chat_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coffee_chats TO authenticated;
GRANT ALL ON public.coffee_chats TO service_role;
ALTER TABLE public.coffee_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_select" ON public.coffee_chats FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, recipient_id));
CREATE POLICY "cc_insert" ON public.coffee_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "cc_update" ON public.coffee_chats FOR UPDATE TO authenticated USING (auth.uid() IN (requester_id, recipient_id));
CREATE TRIGGER coffee_chats_updated_at BEFORE UPDATE ON public.coffee_chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROJECTS (Partner Finder)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proj_select_all" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "proj_insert_own" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "proj_update_own" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "proj_delete_own" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pitch TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_applications TO authenticated;
GRANT ALL ON public.project_applications TO service_role;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "papp_select" ON public.project_applications FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "papp_insert" ON public.project_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);

-- OPPORTUNITIES
CREATE TYPE public.opportunity_type AS ENUM ('internship', 'hackathon', 'competition', 'freelance', 'startup_role', 'other');
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type public.opportunity_type NOT NULL DEFAULT 'other',
  link TEXT,
  location TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opp_select_all" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "opp_insert_own" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "opp_update_own" ON public.opportunities FOR UPDATE TO authenticated USING (auth.uid() = poster_id);
CREATE POLICY "opp_delete_own" ON public.opportunities FOR DELETE TO authenticated USING (auth.uid() = poster_id);
