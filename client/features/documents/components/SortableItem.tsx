"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SelectionItem } from "./generate-doc-constants";
import { selKey } from "./generate-doc-constants";

export function SortableItem({
  item,
  label,
  badges,
  onRemove,
  children,
}: {
  item: SelectionItem;
  label: string;
  badges?: { text: string; color: string }[];
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: selKey(item) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none text-slate-400 hover:text-slate-600"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
        <span className="text-xs font-medium uppercase text-slate-400">
          {item.type === "block" ? "Bloc" : "Hôtel"}
        </span>
        <span className="flex-1 truncate text-sm text-slate-700">{label}</span>
        {badges?.map((b) => (
          <span
            key={b.text}
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${b.color}`}
          >
            {b.text}
          </span>
        ))}
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-slate-300 hover:text-red-500"
          title="Retirer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}
