DROP TABLE IF EXISTS public.offer_document_selections;
DROP TABLE IF EXISTS public.hotel_documents;

DELETE FROM public.document_blocks
WHERE NOT (
   destination = 'master'
   AND season = 'powerpoint'
   AND lang = 'master'
);
