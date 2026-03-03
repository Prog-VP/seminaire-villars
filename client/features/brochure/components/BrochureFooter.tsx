"use client";

type Props = {
  onPrint?: () => void;
};

export function BrochureFooter({ onPrint }: Props) {
  return (
    <footer className="mt-12 border-t border-slate-200 pt-6 text-center print:mt-8">
      <p className="text-xs text-slate-400">
        Villars &amp; Diablerets Tourisme — Séminaires &amp; Congrès
      </p>
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="mt-4 rounded-lg bg-gradient-to-r from-brand-900 to-brand-700 px-6 py-2 text-sm font-medium text-white transition hover:from-brand-800 hover:to-brand-600 print:hidden"
        >
          Imprimer / PDF
        </button>
      )}
    </footer>
  );
}
