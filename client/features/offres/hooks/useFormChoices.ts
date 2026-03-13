import { useMemo } from "react";
import { useSettings } from "@/features/settings/context";
import type { OfferFormValues } from "../components/offer-form-types";

function mergeOption(options: string[], currentValue?: string | null) {
  if (!currentValue) return options;
  return options.includes(currentValue) ? options : [...options, currentValue];
}

export function useFormChoices(formState: OfferFormValues) {
  const { options } = useSettings();

  const pays = useMemo(() => mergeOption(options.pays, formState.pays), [options.pays, formState.pays]);
  const typeSociete = useMemo(() => mergeOption(options.typeSociete, formState.typeSociete), [options.typeSociete, formState.typeSociete]);
  const langue = useMemo(() => mergeOption(options.langue, formState.langue), [options.langue, formState.langue]);
  const titre = useMemo(() => mergeOption(options.titreContact, formState.titreContact), [options.titreContact, formState.titreContact]);
  const typeSejour = useMemo(() => mergeOption(options.typeSejour, formState.typeSejour), [options.typeSejour, formState.typeSejour]);
  const traitePar = useMemo(() => mergeOption(options.traitePar, formState.traitePar), [options.traitePar, formState.traitePar]);
  const transmisPar = useMemo(() => mergeOption(options.transmisPar, formState.transmisPar), [options.transmisPar, formState.transmisPar]);

  const categorie = useMemo(() => {
    const selected = formState.categorieHotel ? formState.categorieHotel.split(",").filter(Boolean) : [];
    const merged = [...options.categorieHotel];
    for (const val of selected) if (!merged.includes(val)) merged.push(val);
    return merged;
  }, [options.categorieHotel, formState.categorieHotel]);

  const station = useMemo(() => {
    const base = ["Villars", "Diablerets"];
    for (const val of options.stationDemandee) if (!base.includes(val)) base.push(val);
    const selected = formState.stationDemandee ? formState.stationDemandee.split(",").map((s) => s.trim()).filter(Boolean) : [];
    for (const val of selected) if (!base.includes(val)) base.push(val);
    return base;
  }, [options.stationDemandee, formState.stationDemandee]);

  return { pays, typeSociete, langue, titre, typeSejour, traitePar, transmisPar, categorie, station };
}
