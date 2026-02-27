-- ============================================================================
-- Supabase Migration: Séminaire Application
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. ENUM for setting types
-- --------------------------------------------------------------------------
CREATE TYPE setting_type AS ENUM (
  'transmisPar',
  'traitePar',
  'pays',
  'langue',
  'typeSociete',
  'typeSejour',
  'categorieHotel',
  'stationDemandee',
  'titreContact'
);

-- --------------------------------------------------------------------------
-- 2. TABLES
-- --------------------------------------------------------------------------

-- Offers table (camelCase columns to match TypeScript types)
CREATE TABLE offers (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "societeContact"          text NOT NULL,
  "dateEnvoiOffre"          date,
  "typeSociete"             text NOT NULL DEFAULT '',
  "pays"                    text NOT NULL DEFAULT '',
  "emailContact"            text,
  "langue"                  text,
  "titreContact"            text,
  "nomContact"              text,
  "prenomContact"           text,
  "sejourDu"                date,
  "sejourAu"                date,
  "activitesVillarsDiablerets" boolean DEFAULT false,
  "nombreDeNuits"           text,
  "nombrePax"               integer,
  "transmisPar"             text,
  "typeSejour"              text,
  "categorieHotel"          text,
  "stationDemandee"         text,
  "relanceEffectueeLe"      date,
  "reservationEffectuee"    boolean DEFAULT false,
  "contactEntreDansBrevo"   boolean DEFAULT false,
  "autres"                  text,
  "traitePar"               text,
  "shareToken"              uuid UNIQUE,
  "createdAt"               timestamptz DEFAULT now(),
  "updatedAt"               timestamptz DEFAULT now()
);

-- Hotel responses table
CREATE TABLE hotel_responses (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id      uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  "hotelName"        text NOT NULL,
  "respondentName"   text,
  "message"          text NOT NULL,
  "createdAt"        timestamptz DEFAULT now()
);

-- Offer comments table
CREATE TABLE offer_comments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id      uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  "author"           text NOT NULL,
  "content"          text NOT NULL,
  "date"             text,
  "createdAt"        timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE settings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type          setting_type NOT NULL,
  label         text NOT NULL,
  UNIQUE(type, label)
);

-- --------------------------------------------------------------------------
-- 3. INDEXES
-- --------------------------------------------------------------------------
CREATE INDEX idx_offers_share_token ON offers ("shareToken") WHERE "shareToken" IS NOT NULL;
CREATE INDEX idx_hotel_responses_offer_id ON hotel_responses (offer_id);
CREATE INDEX idx_offer_comments_offer_id ON offer_comments (offer_id);
CREATE INDEX idx_settings_type ON settings (type);

-- --------------------------------------------------------------------------
-- 4. TRIGGER: auto-update "updatedAt" on offers
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Offers: authenticated users have full access
CREATE POLICY "Authenticated users can read offers"
  ON offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete offers"
  ON offers FOR DELETE
  TO authenticated
  USING (true);

-- Hotel responses: authenticated users have full access
CREATE POLICY "Authenticated users can read hotel_responses"
  ON hotel_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert hotel_responses"
  ON hotel_responses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update hotel_responses"
  ON hotel_responses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete hotel_responses"
  ON hotel_responses FOR DELETE
  TO authenticated
  USING (true);

-- Offer comments: authenticated users have full access
CREATE POLICY "Authenticated users can read offer_comments"
  ON offer_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert offer_comments"
  ON offer_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update offer_comments"
  ON offer_comments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete offer_comments"
  ON offer_comments FOR DELETE
  TO authenticated
  USING (true);

-- Settings: authenticated users have full access
CREATE POLICY "Authenticated users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete settings"
  ON settings FOR DELETE
  TO authenticated
  USING (true);

-- --------------------------------------------------------------------------
-- 6. RPC FUNCTIONS (SECURITY DEFINER for anonymous access to shared offers)
-- --------------------------------------------------------------------------

-- get_shared_offer: returns offer + hotel responses by share token
CREATE OR REPLACE FUNCTION get_shared_offer(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_result json;
BEGIN
  SELECT id, "societeContact", "sejourDu", "sejourAu", "nombrePax", "nombreDeNuits"
  INTO v_offer
  FROM offers
  WHERE "shareToken" = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', v_offer.id,
    'societeContact', v_offer."societeContact",
    'sejourDu', v_offer."sejourDu",
    'sejourAu', v_offer."sejourAu",
    'nombrePax', v_offer."nombrePax",
    'nombreDeNuits', v_offer."nombreDeNuits",
    'hotelResponses', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', hr.id,
          'hotelName', hr."hotelName",
          'respondentName', hr."respondentName",
          'message', hr."message",
          'createdAt', hr."createdAt"
        ) ORDER BY hr."createdAt"
      )
      FROM hotel_responses hr
      WHERE hr.offer_id = v_offer.id
      ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- submit_hotel_response: insert a response via share token (anon access)
CREATE OR REPLACE FUNCTION submit_hotel_response(
  p_token uuid,
  p_hotel_name text,
  p_respondent_name text DEFAULT NULL,
  p_message text DEFAULT '',
  p_wants_confirmation boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_new_response record;
  v_responses json;
  v_confirmation json := NULL;
BEGIN
  SELECT id, "societeContact", "sejourDu", "sejourAu", "nombrePax"
  INTO v_offer
  FROM offers
  WHERE "shareToken" = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found for token %', p_token;
  END IF;

  INSERT INTO hotel_responses (offer_id, "hotelName", "respondentName", "message")
  VALUES (v_offer.id, p_hotel_name, p_respondent_name, p_message)
  RETURNING * INTO v_new_response;

  -- Fetch all responses for this offer
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', hr.id,
      'hotelName', hr."hotelName",
      'respondentName', hr."respondentName",
      'message', hr."message",
      'createdAt', hr."createdAt"
    ) ORDER BY hr."createdAt"
  ), '[]'::json)
  INTO v_responses
  FROM hotel_responses hr
  WHERE hr.offer_id = v_offer.id;

  -- Build confirmation if requested
  IF p_wants_confirmation THEN
    v_confirmation := json_build_object(
      'client', v_offer."societeContact",
      'stay', json_build_object(
        'from', COALESCE(to_char(v_offer."sejourDu", 'DD.MM.YYYY'), '—'),
        'to', COALESCE(to_char(v_offer."sejourAu", 'DD.MM.YYYY'), '—')
      ),
      'participants', v_offer."nombrePax",
      'hotel', p_hotel_name,
      'contact', p_respondent_name,
      'message', p_message,
      'submittedAt', v_new_response."createdAt"
    );
  END IF;

  RETURN json_build_object(
    'hotelResponses', v_responses,
    'confirmation', v_confirmation
  );
END;
$$;

-- Grant execute to anon so public sharing works
GRANT EXECUTE ON FUNCTION get_shared_offer(uuid) TO anon;
GRANT EXECUTE ON FUNCTION submit_hotel_response(uuid, text, text, text, boolean) TO anon;

-- --------------------------------------------------------------------------
-- 7. STORAGE: offer-annexes bucket
-- --------------------------------------------------------------------------

-- Create private bucket (20MB file limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('offer-annexes', 'offer-annexes', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can manage files
CREATE POLICY "Authenticated users can upload offer annexes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'offer-annexes');

CREATE POLICY "Authenticated users can read offer annexes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'offer-annexes');

CREATE POLICY "Authenticated users can delete offer annexes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'offer-annexes');

-- --------------------------------------------------------------------------
-- 8. SEED: default settings
-- --------------------------------------------------------------------------
INSERT INTO settings (type, label) VALUES
  -- transmisPar
  ('transmisPar', 'DIRECT (OT, AV, formulaire)'),
  ('transmisPar', 'SCIB BE'),
  ('transmisPar', 'SCIB UK'),
  ('transmisPar', 'SCIB FR'),
  ('transmisPar', 'SCIB DE'),
  ('transmisPar', 'AUTRE'),
  ('transmisPar', 'SCIB NORDICS'),
  ('transmisPar', 'VP'),
  -- traitePar
  ('traitePar', 'MP'),
  ('traitePar', 'RC'),
  ('traitePar', 'LL'),
  ('traitePar', 'GC'),
  -- pays
  ('pays', 'CH'),
  ('pays', 'FR'),
  ('pays', 'UK'),
  ('pays', 'BE'),
  ('pays', 'DE'),
  ('pays', 'PL'),
  ('pays', 'CAN'),
  ('pays', 'CZ'),
  -- langue
  ('langue', 'Français'),
  ('langue', 'Allemand'),
  ('langue', 'Anglais'),
  -- typeSociete
  ('typeSociete', 'Agence'),
  ('typeSociete', 'Entreprise'),
  -- typeSejour
  ('typeSejour', 'Groupe'),
  ('typeSejour', 'Incentive'),
  ('typeSejour', 'Séminaire'),
  -- categorieHotel
  ('categorieHotel', '1*'),
  ('categorieHotel', '2*'),
  ('categorieHotel', '3*'),
  ('categorieHotel', '4*'),
  ('categorieHotel', '5*'),
  -- stationDemandee
  ('stationDemandee', 'Villars'),
  ('stationDemandee', 'Diablerets'),
  -- titreContact
  ('titreContact', 'M.'),
  ('titreContact', 'Mme'),
  ('titreContact', 'Mx'),
  ('titreContact', 'Autre')
ON CONFLICT (type, label) DO NOTHING;
