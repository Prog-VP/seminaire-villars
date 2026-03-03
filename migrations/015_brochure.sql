-- ============================================================================
-- Migration 015: Brochure templates & offer brochures
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add destination + slug columns to hotels
-- ---------------------------------------------------------------------------
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS destination text;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS slug text;

-- ---------------------------------------------------------------------------
-- 2. Brochure templates — base content per (destination, language)
-- ---------------------------------------------------------------------------
CREATE TABLE brochure_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,          -- 'villars' | 'diablerets'
  lang        text NOT NULL,          -- 'fr' | 'en' | 'de'
  sections    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(destination, lang)
);

-- ---------------------------------------------------------------------------
-- 3. Offer brochures — editable copy per offer
-- ---------------------------------------------------------------------------
CREATE TABLE offer_brochures (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    uuid REFERENCES offers(id) ON DELETE CASCADE,
  destination text NOT NULL,
  lang        text NOT NULL,
  sections    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(offer_id)
);

-- ---------------------------------------------------------------------------
-- 4. updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_brochure_templates_updated_at
  BEFORE UPDATE ON brochure_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_offer_brochures_updated_at
  BEFORE UPDATE ON offer_brochures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 5. RLS policies
-- ---------------------------------------------------------------------------

-- brochure_templates: authenticated full CRUD
ALTER TABLE brochure_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brochure_templates"
  ON brochure_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert brochure_templates"
  ON brochure_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update brochure_templates"
  ON brochure_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brochure_templates"
  ON brochure_templates FOR DELETE
  TO authenticated
  USING (true);

-- offer_brochures: authenticated full CRUD
ALTER TABLE offer_brochures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read offer_brochures"
  ON offer_brochures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert offer_brochures"
  ON offer_brochures FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update offer_brochures"
  ON offer_brochures FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete offer_brochures"
  ON offer_brochures FOR DELETE
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 6. RPC for public (anonymous) brochure access via share token
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_offer_brochure(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer_id uuid;
  v_result jsonb;
BEGIN
  -- Find offer by share token
  SELECT id INTO v_offer_id
  FROM offers
  WHERE "shareToken" = p_token;

  IF v_offer_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build result: offer basics + brochure sections
  SELECT jsonb_build_object(
    'id', o.id,
    'numeroOffre', o."numeroOffre",
    'societeContact', o."societeContact",
    'stationDemandee', o."stationDemandee",
    'langue', o.langue,
    'brochure', CASE
      WHEN ob.id IS NOT NULL THEN jsonb_build_object(
        'id', ob.id,
        'destination', ob.destination,
        'lang', ob.lang,
        'sections', ob.sections,
        'updatedAt', ob.updated_at
      )
      ELSE NULL
    END
  ) INTO v_result
  FROM offers o
  LEFT JOIN offer_brochures ob ON ob.offer_id = o.id
  WHERE o.id = v_offer_id;

  RETURN v_result;
END;
$$;

-- Grant execute on the RPC to anon role (public access)
GRANT EXECUTE ON FUNCTION get_offer_brochure(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_offer_brochure(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Seed empty templates for all 6 combinations
-- ---------------------------------------------------------------------------
INSERT INTO brochure_templates (destination, lang, sections) VALUES
  ('villars', 'fr', '[]'::jsonb),
  ('villars', 'en', '[]'::jsonb),
  ('villars', 'de', '[]'::jsonb),
  ('diablerets', 'fr', '[]'::jsonb),
  ('diablerets', 'en', '[]'::jsonb),
  ('diablerets', 'de', '[]'::jsonb)
ON CONFLICT (destination, lang) DO NOTHING;
