CREATE SEQUENCE offers_numero_seq START WITH 550;
ALTER TABLE offers ADD COLUMN "numeroOffre" text
  DEFAULT ('2026-' || nextval('offers_numero_seq')::text);
