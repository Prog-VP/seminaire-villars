-- ============================================================
-- Migration : profiles table + roles system
-- ============================================================

-- Table profiles liée à auth.users
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'standard' CHECK (role IN ('admin', 'standard')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS : tous les authenticated peuvent lire
CREATE POLICY "read profiles" ON profiles FOR SELECT TO authenticated USING (true);
-- Pas de INSERT/UPDATE/DELETE policy → seul service_role peut modifier

-- Trigger auto-création profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'standard');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RPC : rôle du user courant
CREATE OR REPLACE FUNCTION get_my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- RPC : liste tous les users avec rôle
CREATE OR REPLACE FUNCTION get_users_with_roles()
RETURNS TABLE (id uuid, email text, role text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT au.id, au.email::text, COALESCE(p.role, 'standard'), au.created_at
  FROM auth.users au LEFT JOIN profiles p ON p.id = au.id
  ORDER BY au.created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION get_users_with_roles() TO authenticated;

-- Backfill users existants
INSERT INTO profiles (id, role)
SELECT id, 'standard' FROM auth.users WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Après exécution, promouvoir votre compte admin :
-- UPDATE profiles SET role = 'admin' WHERE id = '<votre-uuid>';
