"use client";

import { DocumentBlocksPage } from "@/features/documents/components/DocumentBlocksPage";

export default function DocumentsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez les blocs Word modulaires par destination, saison et langue.
        </p>
      </div>
      <DocumentBlocksPage />
    </div>
  );
}
