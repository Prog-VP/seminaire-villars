-- RPC: get_client_offer
-- Returns enriched offer data + filtered hotel responses for the public client offer page.
-- Uses the existing shareToken on offers (no new table needed).

CREATE OR REPLACE FUNCTION get_client_offer(p_token uuid, p_response_ids uuid[] DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer record;
  v_result json;
BEGIN
  SELECT
    id,
    "numeroOffre",
    "societeContact",
    "typeSociete",
    "pays",
    "emailContact",
    "telephoneContact",
    "langue",
    "titreContact",
    "nomContact",
    "prenomContact",
    "sejourDu",
    "sejourAu",
    "dateOptions",
    "dateConfirmeeDu",
    "dateConfirmeeAu",
    "nombreDeNuits",
    "nombrePax",
    "chambresSimple",
    "chambresDouble",
    "chambresAutre",
    "typeSejour",
    "categorieHotel",
    "categorieHotelAutre",
    "stationDemandee",
    "seminaire",
    "seminaireJournee",
    "seminaireDemiJournee",
    "seminaireDetails"
  INTO v_offer
  FROM offers
  WHERE "shareToken" = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', v_offer.id,
    'numeroOffre', v_offer."numeroOffre",
    'societeContact', v_offer."societeContact",
    'typeSociete', v_offer."typeSociete",
    'pays', v_offer."pays",
    'emailContact', v_offer."emailContact",
    'telephoneContact', v_offer."telephoneContact",
    'langue', v_offer."langue",
    'titreContact', v_offer."titreContact",
    'nomContact', v_offer."nomContact",
    'prenomContact', v_offer."prenomContact",
    'sejourDu', v_offer."sejourDu",
    'sejourAu', v_offer."sejourAu",
    'dateOptions', COALESCE(v_offer."dateOptions", '[]'::jsonb),
    'dateConfirmeeDu', v_offer."dateConfirmeeDu",
    'dateConfirmeeAu', v_offer."dateConfirmeeAu",
    'nombreDeNuits', v_offer."nombreDeNuits",
    'nombrePax', v_offer."nombrePax",
    'chambresSimple', v_offer."chambresSimple",
    'chambresDouble', v_offer."chambresDouble",
    'chambresAutre', v_offer."chambresAutre",
    'typeSejour', v_offer."typeSejour",
    'categorieHotel', v_offer."categorieHotel",
    'categorieHotelAutre', v_offer."categorieHotelAutre",
    'stationDemandee', v_offer."stationDemandee",
    'seminaire', v_offer."seminaire",
    'seminaireJournee', v_offer."seminaireJournee",
    'seminaireDemiJournee', v_offer."seminaireDemiJournee",
    'seminaireDetails', v_offer."seminaireDetails",
    'hotelResponses', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', hr.id,
          'hotelName', hr."hotelName",
          'respondentName', hr."respondentName",
          'message', hr."message",
          'createdAt', hr."createdAt"
        ) ORDER BY hr."createdAt"
      )
      FROM hotel_responses hr
      WHERE hr.offer_id = v_offer.id
        AND (p_response_ids IS NULL OR hr.id = ANY(p_response_ids))
      ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_offer(uuid, uuid[]) TO anon;
