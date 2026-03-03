-- ============================================================================
-- Migration 009: Hotels table
-- ============================================================================

CREATE TABLE hotels (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom         text NOT NULL,
  email       text,
  created_at  timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read hotels"
  ON hotels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert hotels"
  ON hotels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update hotels"
  ON hotels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete hotels"
  ON hotels FOR DELETE
  TO authenticated
  USING (true);
