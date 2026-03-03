CREATE TABLE offer_document_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  block_id uuid REFERENCES document_blocks(id) ON DELETE CASCADE,
  response_id uuid REFERENCES hotel_responses(id) ON DELETE CASCADE,
  hotel_document_id uuid REFERENCES hotel_documents(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  -- Exactement un des deux doit être rempli
  CONSTRAINT one_type CHECK (
    (block_id IS NOT NULL AND response_id IS NULL) OR
    (block_id IS NULL AND response_id IS NOT NULL)
  )
);

-- Empêcher les doublons
CREATE UNIQUE INDEX uq_offer_block ON offer_document_selections(offer_id, block_id) WHERE block_id IS NOT NULL;
CREATE UNIQUE INDEX uq_offer_response ON offer_document_selections(offer_id, response_id) WHERE response_id IS NOT NULL;

-- RLS
ALTER TABLE offer_document_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated full access" ON offer_document_selections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
