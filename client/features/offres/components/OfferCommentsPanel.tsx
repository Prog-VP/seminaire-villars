"use client";

import { useMemo, useState } from "react";
import type { OfferComment } from "../types";

type OfferCommentsPanelProps = {
  comments: OfferComment[];
  onAdd: (payload: { author: string; content: string; date?: string }) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isLoading: boolean;
  isSubmitting: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("fr-CH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function OfferCommentsPanel({
  comments,
  onAdd,
  onDelete,
  isLoading,
  isSubmitting,
}: OfferCommentsPanelProps) {
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sortedComments = useMemo(
    () =>
      [...comments].sort((a, b) => {
        const dateA = a.date ?? a.createdAt ?? "";
        const dateB = b.date ?? b.createdAt ?? "";
        return dateB.localeCompare(dateA);
      }),
    [comments]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!author.trim() || !content.trim()) {
      setError("Nom et commentaire sont requis.");
      return;
    }
    try {
      setError(null);
      await onAdd({
        author: author.trim(),
        content: content.trim(),
        date: new Date().toISOString(),
      });
      setAuthor("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter le commentaire.");
    }
  };

  return (
    <section className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <header>
          <h3 className="text-lg font-semibold text-slate-900">Ajouter un commentaire</h3>
          <p className="text-sm text-slate-500">
            Partagez une information interne liée à cette offre.
          </p>
        </header>
        <label className="text-sm font-medium text-slate-700">
          Nom *
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Commentaire *
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ajout..." : "Publier"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Chargement des commentaires...
          </div>
        ) : sortedComments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            Aucun commentaire enregistré pour cette offre.
          </p>
        ) : (
          sortedComments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <header className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                <span className="text-xs text-slate-400">
                  {comment.date
                    ? dateFormatter.format(new Date(comment.date))
                    : comment.createdAt
                      ? dateFormatter.format(new Date(comment.createdAt))
                      : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void onDelete(comment.id);
                  }}
                  className="ml-auto text-xs font-semibold text-red-600 transition hover:text-red-700"
                >
                  Supprimer
                </button>
              </header>
              <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
