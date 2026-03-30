export type OfferFormValues = {
  activiteUniquement: boolean;
  activitesDemandees: boolean;
  societeContact: string;
  typeSociete: string;
  pays: string;
  nomContact: string;
  prenomContact: string;
  titreContact: string;
  emailContact: string;
  telephoneContact: string;
  langue: string;
  typeSejour: string;
  categorieHotel: string;
  categorieHotelAutre: string;
  stationDemandee: string;
  nombreDeNuits: string;
  nombrePax: string;
  chambresSimple: string;
  chambresDouble: string;
  chambresAutre: string;
  demiPension: boolean;
  pensionComplete: boolean;
  dateOptions: { du: string; au: string }[];
  dateConfirmeeDu: string;
  dateConfirmeeAu: string;
  transmisPar: string;
  traitePar: string;
  seminaireJournee: boolean;
  seminaireDemiJournee: boolean;
  seminaireDetails: string;
  reservationEffectuee: boolean;
  retourEffectueHotels: boolean;
  contactEntreDansBrevo: boolean;
  dateEnvoiOffre: string;
  relanceEffectueeLe: string;
  statut: string;
};

export const defaultOfferFormValues: OfferFormValues = {
  activiteUniquement: false,
  activitesDemandees: false,
  societeContact: "",
  typeSociete: "",
  pays: "CH",
  nomContact: "",
  prenomContact: "",
  titreContact: "",
  emailContact: "",
  telephoneContact: "",
  langue: "Français",
  typeSejour: "",
  categorieHotel: "",
  categorieHotelAutre: "",
  stationDemandee: "",
  nombreDeNuits: "",
  nombrePax: "",
  chambresSimple: "",
  chambresDouble: "",
  chambresAutre: "",
  demiPension: false,
  pensionComplete: false,
  dateOptions: [{ du: "", au: "" }],
  dateConfirmeeDu: "",
  dateConfirmeeAu: "",
  transmisPar: "",
  traitePar: "",
  seminaireJournee: false,
  seminaireDemiJournee: false,
  seminaireDetails: "",
  reservationEffectuee: false,
  retourEffectueHotels: false,
  contactEntreDansBrevo: false,
  dateEnvoiOffre: "",
  relanceEffectueeLe: "",
  statut: "Brouillon",
};

export type StepDef = { key: string; label: string };

export const ALL_STEPS: StepDef[] = [
  { key: "societe", label: "Société" },
  { key: "contact", label: "Contact" },
  { key: "sejour", label: "Séjour" },
  { key: "seminaire", label: "Séminaire" },
  { key: "finalisation", label: "Finalisation" },
];

export type OfferFormProps = {
  initialValues?: Partial<OfferFormValues>;
  onSubmit: (values: OfferFormValues) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  cancelLabel?: string;
  heading?: string;
  subheading?: string;
  showFollowUpFields?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
  isDeleteLoading?: boolean;
  stepper?: boolean;
};
