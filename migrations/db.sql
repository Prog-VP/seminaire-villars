-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.app_config (
   key text NOT NULL,
   value text NOT NULL,
   CONSTRAINT app_config_pkey PRIMARY KEY (key)
);
CREATE TABLE public.brochure_templates (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   destination text NOT NULL,
   lang text NOT NULL,
   sections jsonb NOT NULL DEFAULT '[]'::jsonb,
   created_at timestamp with time zone DEFAULT now(),
   updated_at timestamp with time zone DEFAULT now(),
   CONSTRAINT brochure_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.document_blocks (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   destination text NOT NULL,
   season text NOT NULL,
   lang text NOT NULL,
   name text NOT NULL,
   file_path text NOT NULL,
   created_at timestamp with time zone DEFAULT now(),
   CONSTRAINT document_blocks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hotel_documents (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   hotel_id uuid,
   lang text NOT NULL,
   file_path text NOT NULL,
   created_at timestamp with time zone DEFAULT now(),
   CONSTRAINT hotel_documents_pkey PRIMARY KEY (id),
   CONSTRAINT hotel_documents_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);
CREATE TABLE public.hotel_responses (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   offer_id uuid NOT NULL,
   hotelName text NOT NULL,
   respondentName text,
   message text NOT NULL,
   createdAt timestamp with time zone DEFAULT now(),
   offerText text,
   CONSTRAINT hotel_responses_pkey PRIMARY KEY (id),
   CONSTRAINT hotel_responses_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id)
);
CREATE TABLE public.hotels (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   nom text NOT NULL,
   email text,
   created_at timestamp with time zone DEFAULT now(),
   destination text,
   slug text,
   CONSTRAINT hotels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.offer_brochures (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   offer_id uuid UNIQUE,
   destination text NOT NULL,
   lang text NOT NULL,
   sections jsonb NOT NULL DEFAULT '[]'::jsonb,
   created_at timestamp with time zone DEFAULT now(),
   updated_at timestamp with time zone DEFAULT now(),
   CONSTRAINT offer_brochures_pkey PRIMARY KEY (id),
   CONSTRAINT offer_brochures_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id)
);
CREATE TABLE public.offer_comments (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   offer_id uuid NOT NULL,
   author text NOT NULL,
   content text NOT NULL,
   date text,
   createdAt timestamp with time zone DEFAULT now(),
   CONSTRAINT offer_comments_pkey PRIMARY KEY (id),
   CONSTRAINT offer_comments_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id)
);
CREATE TABLE public.offer_document_selections (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   offer_id uuid NOT NULL,
   block_id uuid,
   response_id uuid,
   created_at timestamp with time zone DEFAULT now(),
   sort_order integer NOT NULL DEFAULT 0,
   hotel_document_id uuid,
   CONSTRAINT offer_document_selections_pkey PRIMARY KEY (id),
   CONSTRAINT offer_document_selections_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id),
   CONSTRAINT offer_document_selections_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.document_blocks(id),
   CONSTRAINT offer_document_selections_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.hotel_responses(id),
   CONSTRAINT offer_document_selections_hotel_document_id_fkey FOREIGN KEY (hotel_document_id) REFERENCES public.hotel_documents(id)
);
CREATE TABLE public.offer_hotel_sends (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   offer_id uuid NOT NULL,
   hotel_id uuid NOT NULL,
   sent_at timestamp with time zone DEFAULT now(),
   CONSTRAINT offer_hotel_sends_pkey PRIMARY KEY (id),
   CONSTRAINT offer_hotel_sends_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id),
   CONSTRAINT offer_hotel_sends_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);
CREATE TABLE public.offers (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   societeContact text NOT NULL,
   typeSociete text NOT NULL DEFAULT ''::text,
   pays text NOT NULL DEFAULT ''::text,
   emailContact text,
   langue text,
   titreContact text,
   nomContact text,
   prenomContact text,
   nombreDeNuits text,
   nombrePax integer,
   transmisPar text,
   typeSejour text,
   categorieHotel text,
   stationDemandee text,
   relanceEffectueeLe date,
   reservationEffectuee boolean DEFAULT false,
   contactEntreDansBrevo boolean DEFAULT false,
   traitePar text,
   shareToken uuid UNIQUE,
   createdAt timestamp with time zone DEFAULT now(),
   updatedAt timestamp with time zone DEFAULT now(),
   telephoneContact text,
   categorieHotelAutre text,
   dateOptions jsonb DEFAULT '[]'::jsonb,
   dateConfirmeeDu date,
   dateConfirmeeAu date,
   chambresSimple integer,
   chambresDouble integer,
   chambresAutre integer,
   seminaire boolean,
   seminaireJournee boolean,
   seminaireDemiJournee boolean,
   seminaireDetails text,
   activiteUniquement boolean,
   numeroOffre text DEFAULT (nextval('offers_numero_seq'::regclass))::text,
   statut text DEFAULT 'brouillon'::text,
   dateEnvoiOffre date,
   retourEffectueHotels boolean DEFAULT false,
   CONSTRAINT offers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
   id uuid NOT NULL,
   role text NOT NULL DEFAULT 'standard'::text CHECK (
      role = ANY (ARRAY ['admin'::text, 'standard'::text])
   ),
   created_at timestamp with time zone DEFAULT now(),
   nom text NOT NULL DEFAULT ''::text,
   prenom text NOT NULL DEFAULT ''::text,
   favorite_filters jsonb DEFAULT '[]'::jsonb,
   CONSTRAINT profiles_pkey PRIMARY KEY (id),
   CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.settings (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   type USER - DEFINED NOT NULL,
   label text NOT NULL,
   color text,
   CONSTRAINT settings_pkey PRIMARY KEY (id)
);