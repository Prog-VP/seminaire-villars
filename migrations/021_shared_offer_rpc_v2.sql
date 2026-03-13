-- ============================================================================
-- Migration 021: Enrichir get_shared_offer + supprimer hotelResponses du retour
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Seed chf_eur_rate dans app_config (taux de conversion CHF → EUR)
-- --------------------------------------------------------------------------

INSERT INTO app_config (key, value)
VALUES ('chf_eur_rate', '0.94')
ON CONFLICT (key) DO NOTHING;

-- --------------------------------------------------------------------------
-- 2. RPC enrichie : ajouter les champs manquants, supprimer hotelResponses
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_shared_offer(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_result json;
BEGIN
  SELECT id, "societeContact", "dateOptions", "dateConfirmeeDu", "dateConfirmeeAu",
         "nombrePax", "nombreDeNuits",
         "chambresSimple", "chambresDouble", "chambresAutre",
         "seminaire", "seminaireJournee", "seminaireDemiJournee", "seminaireDetails",
         "langue", "typeSejour", "activiteUniquement"
  INTO v_offer
  FROM offers
  WHERE "shareToken" = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', v_offer.id,
    'societeContact', v_offer."societeContact",
    'dateOptions', COALESCE(v_offer."dateOptions", '[]'::jsonb),
    'dateConfirmeeDu', v_offer."dateConfirmeeDu",
    'dateConfirmeeAu', v_offer."dateConfirmeeAu",
    'nombrePax', v_offer."nombrePax",
    'nombreDeNuits', v_offer."nombreDeNuits",
    'chambresSimple', v_offer."chambresSimple",
    'chambresDouble', v_offer."chambresDouble",
    'chambresAutre', v_offer."chambresAutre",
    'seminaire', v_offer."seminaire",
    'seminaireJournee', v_offer."seminaireJournee",
    'seminaireDemiJournee', v_offer."seminaireDemiJournee",
    'seminaireDetails', v_offer."seminaireDetails",
    'langue', v_offer."langue",
    'typeSejour', v_offer."typeSejour",
    'activiteUniquement', v_offer."activiteUniquement"
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- --------------------------------------------------------------------------
-- 3. Politique RLS pour permettre aux anon de lire chf_eur_rate
-- --------------------------------------------------------------------------

CREATE POLICY "Anon can read chf_eur_rate"
  ON app_config FOR SELECT TO anon
  USING (key = 'chf_eur_rate');
