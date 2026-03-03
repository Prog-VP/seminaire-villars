-- ============================================================================
-- Migration 010: Offer-Hotel sends tracking
-- ============================================================================

CREATE TABLE offer_hotel_sends (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id   uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  hotel_id   uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  sent_at    timestamptz DEFAULT now(),
  UNIQUE(offer_id, hotel_id)
);

-- RLS
ALTER TABLE offer_hotel_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read offer_hotel_sends"
  ON offer_hotel_sends FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert offer_hotel_sends"
  ON offer_hotel_sends FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update offer_hotel_sends"
  ON offer_hotel_sends FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete offer_hotel_sends"
  ON offer_hotel_sends FOR DELETE
  TO authenticated
  USING (true);
