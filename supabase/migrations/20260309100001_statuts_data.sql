-- Insert default statut settings
INSERT INTO settings (type, label)
VALUES
  ('statut', 'Brouillon'),
  ('statut', 'Envoyé'),
  ('statut', 'Refusé'),
  ('statut', 'Confirmé')
ON CONFLICT DO NOTHING;

-- Migrate existing offer statut values from legacy keys to labels
UPDATE offers SET statut = 'Brouillon'  WHERE statut = 'brouillon';
UPDATE offers SET statut = 'Envoyé'     WHERE statut = 'envoye';
UPDATE offers SET statut = 'Refusé'     WHERE statut = 'refuse';
UPDATE offers SET statut = 'Confirmé'   WHERE statut = 'confirme';
