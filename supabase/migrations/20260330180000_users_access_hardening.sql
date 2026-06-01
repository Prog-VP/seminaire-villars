drop policy if exists "read profiles" on public.profiles;
create policy "read own profile" on public.profiles for
select to authenticated using (id = auth.uid());
create or replace function public.get_users_with_roles() returns table(
    id uuid,
    email text,
    role text,
    created_at timestamp with time zone,
    nom text,
    prenom text
  ) language plpgsql stable security definer
set search_path to 'public' as $function$ begin if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then raise exception 'admin only';
end if;
return query
select au.id,
  au.email::text,
  coalesce(p.role, 'standard'),
  au.created_at,
  coalesce(p.nom, ''),
  coalesce(p.prenom, '')
from auth.users au
  left join public.profiles p on p.id = au.id
order by au.created_at asc;
end;
$function$;