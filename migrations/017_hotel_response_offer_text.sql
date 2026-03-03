-- Add offer_text column: editable version of the hotel response for the final offer document.
-- NULL means "not yet customized" → use message as fallback.
ALTER TABLE hotel_responses
  ADD COLUMN "offerText" text;
