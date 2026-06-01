alter table public.hotels
  add column if not exists ppt_tag text;

update public.hotels as h
set ppt_tag = coalesce(
  nullif(
    (
      select string_agg(token, '_' order by ord)
      from unnest(
        regexp_split_to_array(
          upper(
            translate(
              coalesce(h.nom, ''),
              'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝýÿ',
              'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOOooooooUUUUuuuuYyy'
            )
          ),
          '[^A-Z0-9]+'
        )
      ) with ordinality as parts(token, ord)
      where token <> ''
        and token not in ('A', 'AU', 'AUX', 'D', 'DE', 'DES', 'DU', 'ET', 'L', 'LA', 'LE', 'LES')
    ),
    ''
  ),
  'HOTEL_' || left(replace(h.id::text, '-', ''), 8)
)
where h.ppt_tag is null
  or h.ppt_tag = '';
