ALTER TABLE offers ADD COLUMN "activiteUniquement" boolean;
ALTER TABLE offers DROP COLUMN IF EXISTS "activitesVillarsDiablerets";
