ALTER TABLE public.hotel_responses
ADD COLUMN IF NOT EXISTS hotel_id uuid;

DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'hotel_responses_hotel_id_fkey'
   ) THEN
      ALTER TABLE public.hotel_responses
      ADD CONSTRAINT hotel_responses_hotel_id_fkey
      FOREIGN KEY (hotel_id) REFERENCES public.hotels(id);
   END IF;
END $$;
