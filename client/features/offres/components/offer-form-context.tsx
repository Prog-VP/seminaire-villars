"use client";

import { createContext, useContext } from "react";
import type { OfferFormValues } from "./offer-form-types";

export type FormCtx = {
  formState: OfferFormValues;
  setFormState: React.Dispatch<React.SetStateAction<OfferFormValues>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputClass: string;
  checkboxClass: string;
};

const OfferFormContext = createContext<FormCtx | null>(null);

export const OfferFormProvider = OfferFormContext.Provider;

export function useOfferFormCtx(): FormCtx {
  const ctx = useContext(OfferFormContext);
  if (!ctx) throw new Error("useOfferFormCtx must be used within OfferFormProvider");
  return ctx;
}
