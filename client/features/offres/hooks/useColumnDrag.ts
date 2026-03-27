import { useRef, useState, type DragEvent } from "react";

export function useColumnDrag(reorderColumns: (from: number, to: number) => void) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (colIndex: number, e: DragEvent<HTMLElement>) => {
    dragIndexRef.current = colIndex;
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: DragEvent<HTMLElement>) => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "";
    }
  };

  const handleDragOver = (colIndex: number, e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(colIndex);
  };

  const handleDragLeave = (colIndex: number) => {
    setDragOverIndex((prev) => (prev === colIndex ? null : prev));
  };

  const handleDrop = (colIndex: number, e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from !== null && from !== colIndex) {
      reorderColumns(from, colIndex);
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  return { dragOverIndex, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop };
}
