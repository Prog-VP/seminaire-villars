-- ============================================================
-- Migration : ajout nom et prénom dans profiles
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nom    text NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prenom text NOT NULL DEFAULT '';

-- Mettre à jour la RPC pour retourner nom et prénom
CREATE OR REPLACE FUNCTION get_users_with_roles()
RETURNS TABLE (id uuid, email text, role text, created_at timestamptz, nom text, prenom text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT au.id, au.email::text, COALESCE(p.role, 'standard'), au.created_at,
         COALESCE(p.nom, ''), COALESCE(p.prenom, '')
  FROM auth.users au LEFT JOIN profiles p ON p.id = au.id
  ORDER BY au.created_at ASC;
$$;

-- Nouvelle RPC : profil du user courant (nom, prénom, rôle)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (role text, nom text, prenom text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.role, COALESCE(p.nom, ''), COALESCE(p.prenom, '')
  FROM profiles p WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION get_my_profile() TO authenticated;
