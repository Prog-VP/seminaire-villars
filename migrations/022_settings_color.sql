-- ============================================================================
-- Migration 022: Ajouter colonne color aux settings (pour les statuts)
-- ============================================================================

ALTER TABLE settings ADD COLUMN IF NOT EXISTS color text;
