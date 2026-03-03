ALTER TABLE offers ADD COLUMN "dateOptions" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE offers ADD COLUMN "dateConfirmeeDu" date;
ALTER TABLE offers ADD COLUMN "dateConfirmeeAu" date;

-- Backfill existing sejourDu/sejourAu into dateOptions[0]
UPDATE offers
SET "dateOptions" = jsonb_build_array(
  jsonb_build_object('du', "sejourDu", 'au', "sejourAu")
)
WHERE "sejourDu" IS NOT NULL OR "sejourAu" IS NOT NULL;
