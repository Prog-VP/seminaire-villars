-- ============================================================================
-- Migration 017: Document blocks & hotel documents
-- ============================================================================

-- 1. Table document_blocks — blocs Word génériques (intro, activités, ski…)
CREATE TABLE document_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,          -- 'villars' | 'diablerets'
  season      text NOT NULL,          -- 'ete' | 'hiver'
  lang        text NOT NULL,          -- 'fr' | 'en' | 'de'
  name        text NOT NULL,          -- ex: "Page de garde", "Activités été"
  file_path   text NOT NULL,          -- chemin dans Supabase Storage
  created_at  timestamptz DEFAULT now()
);

-- 2. Table hotel_documents — documents Word par hôtel
CREATE TABLE hotel_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    uuid REFERENCES hotels(id) ON DELETE CASCADE,
  lang        text NOT NULL,          -- 'fr' | 'en' | 'de'
  file_path   text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(hotel_id, lang)
);

-- 3. Enable RLS
ALTER TABLE document_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies — authenticated users have full CRUD
CREATE POLICY "Authenticated can select document_blocks"
  ON document_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert document_blocks"
  ON document_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete document_blocks"
  ON document_blocks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can select hotel_documents"
  ON hotel_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert hotel_documents"
  ON hotel_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update hotel_documents"
  ON hotel_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete hotel_documents"
  ON hotel_documents FOR DELETE TO authenticated USING (true);

-- 5. Indexes
CREATE INDEX idx_document_blocks_filter ON document_blocks (destination, season, lang);
CREATE INDEX idx_hotel_documents_hotel ON hotel_documents (hotel_id);

-- 6. Storage buckets (run manually in Supabase dashboard or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('document-blocks', 'document-blocks', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('hotel-documents', 'hotel-documents', false);
