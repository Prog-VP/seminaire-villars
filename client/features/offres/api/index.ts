export { mapRow, mapHotelResponse, mapComment, mapSharedOfferRow } from "./mappers";
export type { SharedOfferResponse } from "./mappers";

export {
  fetchOffers,
  fetchOfferById,
  createOffer,
  updateOffer,
  updateOfferStatut,
  deleteOffer,
  duplicateOffer,
  fetchCategorieHotelAutreSuggestions,
} from "./offers";

export { createShareLink, fetchSharedOffer, submitHotelResponse } from "./sharing";

export { updateHotelResponse, deleteHotelResponse } from "./hotel-responses";

export {
  listOfferAttachments,
  uploadOfferAttachment,
  deleteOfferAttachment,
  downloadOfferAttachment,
} from "./attachments";

export {
  listOfferComments,
  addOfferComment,
  updateOfferComment,
  deleteOfferComment,
} from "./comments";

export { fetchOfferHotelSends, recordHotelSend, deleteHotelSend } from "./hotel-sends";
