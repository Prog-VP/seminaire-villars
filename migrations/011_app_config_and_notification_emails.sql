-- ============================================================================
-- Migration 011: app_config table + emailNotification setting type
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Key-value config table (SMTP settings, etc.)
-- --------------------------------------------------------------------------
CREATE TABLE app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert app_config"
  ON app_config FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update app_config"
  ON app_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete app_config"
  ON app_config FOR DELETE TO authenticated USING (true);

-- --------------------------------------------------------------------------
-- 2. Extend setting_type enum with 'emailNotification'
-- --------------------------------------------------------------------------
ALTER TYPE setting_type ADD VALUE IF NOT EXISTS 'emailNotification';
