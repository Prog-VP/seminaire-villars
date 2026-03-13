"use client";

import { useCallback, useState } from "react";
import type { BrochureSection, BrochureSectionType } from "../types";
import { SECTION_TYPE_LABELS } from "./brochure-editor-constants";

type UseBrochureEditorParams = {
  initialSections: BrochureSection[];
  onSave: (sections: BrochureSection[]) => Promise<void>;
  onCopyLink?: () => void;
  onReset?: () => void;
};

export function useBrochureEditor({
  initialSections,
  onSave,
  onCopyLink,
  onReset,
}: UseBrochureEditorParams) {
  const [sections, setSections] = useState<BrochureSection[]>(initialSections);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const updateSection = useCallback(
    (idx: number, patch: Partial<BrochureSection>) => {
      setSections((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      });
      setHasChanges(true);
    },
    []
  );

  const updateSectionMetadata = useCallback(
    (idx: number, metaPatch: Record<string, unknown>) => {
      setSections((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          metadata: { ...next[idx].metadata, ...metaPatch },
        };
        return next;
      });
      setHasChanges(true);
    },
    []
  );

  const handleSave = async () => {
    await onSave(sections);
    setHasChanges(false);
  };

  const handleCopyLink = () => {
    onCopyLink?.();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Réinitialiser la brochure depuis le modèle de base ? Toutes les modifications seront perdues."
      )
    ) {
      onReset?.();
    }
  };

  const moveSection = (fromIdx: number, direction: "up" | "down") => {
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
    setSelectedIdx(toIdx);
    setHasChanges(true);
  };

  const addSection = (type: BrochureSectionType) => {
    const id = `${type}-${Date.now()}`;
    const newSection: BrochureSection = {
      id,
      type,
      enabled: true,
      title: SECTION_TYPE_LABELS[type] ?? "Nouvelle section",
      content: "",
      images: [],
      metadata:
        type === "hotel"
          ? { conferenceRooms: [] }
          : type === "activities-summer" || type === "activities-winter"
            ? { activities: [] }
            : type === "ski"
              ? { skiPrices: [] }
              : undefined,
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedIdx(sections.length); // select the newly added one
    setHasChanges(true);
  };

  const deleteSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx((prev) => (prev >= idx && prev > 0 ? prev - 1 : prev));
    setHasChanges(true);
  };

  const selected = sections[selectedIdx];

  return {
    sections,
    selectedIdx,
    setSelectedIdx,
    linkCopied,
    hasChanges,
    showAddMenu,
    setShowAddMenu,
    selected,
    updateSection,
    updateSectionMetadata,
    handleSave,
    handleCopyLink,
    handleReset,
    moveSection,
    addSection,
    deleteSection,
  };
}
