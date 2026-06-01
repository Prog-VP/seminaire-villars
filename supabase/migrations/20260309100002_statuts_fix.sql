-- Check if statut settings exist and insert them if not
INSERT INTO settings (type, label)
SELECT 'statut', v.label
FROM (VALUES ('Brouillon'), ('Envoyé'), ('Refusé'), ('Confirmé')) AS v(label)
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE type = 'statut' AND label = v.label
);

-- Migrate existing offer statut values from legacy keys to labels (idempotent)
UPDATE offers SET statut = 'Brouillon'  WHERE statut = 'brouillon';
UPDATE offers SET statut = 'Envoyé'     WHERE statut = 'envoye';
UPDATE offers SET statut = 'Refusé'     WHERE statut = 'refuse';
UPDATE offers SET statut = 'Confirmé'   WHERE statut = 'confirme';
