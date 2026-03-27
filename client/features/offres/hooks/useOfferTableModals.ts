import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteOffer, duplicateOffer } from "../api";

type DuplicateOptions = { includeAttachments: boolean; includeHotelData: boolean };

type ModalState =
  | { type: "none" }
  | { type: "delete"; ids: string[] }
  | { type: "duplicate"; ids: string[] };

export function useOfferTableModals(clearSelection: () => void) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [actionLoading, setActionLoading] = useState(false);

  const openDelete = (ids: string[]) => setModal({ type: "delete", ids });
  const openDuplicate = (ids: string[]) => setModal({ type: "duplicate", ids });
  const closeModal = () => setModal({ type: "none" });

  const confirmDelete = async () => {
    if (modal.type !== "delete") return;
    setActionLoading(true);
    try {
      for (const id of modal.ids) {
        await deleteOffer(id);
      }
      clearSelection();
      closeModal();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDuplicate = async (opts: DuplicateOptions) => {
    if (modal.type !== "duplicate") return;
    setActionLoading(true);
    try {
      for (const id of modal.ids) {
        await duplicateOffer(id, opts);
      }
      clearSelection();
      closeModal();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la duplication.");
    } finally {
      setActionLoading(false);
    }
  };

  return { modal, actionLoading, openDelete, openDuplicate, closeModal, confirmDelete, confirmDuplicate };
}
