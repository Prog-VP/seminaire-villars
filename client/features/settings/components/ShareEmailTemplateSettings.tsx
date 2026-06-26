import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_SHARE_EMAIL_TEMPLATE,
  normalizeShareEmailTemplate,
  SHARE_EMAIL_TEMPLATE_KEYS,
} from "@/features/offres/components/share-utils";

export function ShareEmailTemplateSettings() {
  const [subject, setSubject] = useState(DEFAULT_SHARE_EMAIL_TEMPLATE.subject);
  const [body, setBody] = useState(DEFAULT_SHARE_EMAIL_TEMPLATE.body);
  const [savedSubject, setSavedSubject] = useState(DEFAULT_SHARE_EMAIL_TEMPLATE.subject);
  const [savedBody, setSavedBody] = useState(DEFAULT_SHARE_EMAIL_TEMPLATE.body);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("app_config")
      .select("key, value")
      .in("key", [
        SHARE_EMAIL_TEMPLATE_KEYS.subject,
        SHARE_EMAIL_TEMPLATE_KEYS.body,
      ])
      .then(({ data }) => {
        if (!data) return;
        const values = new Map(data.map((row) => [row.key as string, row.value as string]));
        const nextTemplate = normalizeShareEmailTemplate({
          subject:
            values.get(SHARE_EMAIL_TEMPLATE_KEYS.subject) ??
            DEFAULT_SHARE_EMAIL_TEMPLATE.subject,
          body:
            values.get(SHARE_EMAIL_TEMPLATE_KEYS.body) ??
            DEFAULT_SHARE_EMAIL_TEMPLATE.body,
        });
        setSubject(nextTemplate.subject);
        setSavedSubject(nextTemplate.subject);
        setBody(nextTemplate.body);
        setSavedBody(nextTemplate.body);
      });
  }, []);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setSubject(savedSubject);
    setBody(savedBody);
    setEditing(false);
    setStatus("idle");
  };

  const handleReset = () => {
    setSubject(DEFAULT_SHARE_EMAIL_TEMPLATE.subject);
    setBody(DEFAULT_SHARE_EMAIL_TEMPLATE.body);
    setStatus("idle");
  };

  const handleSave = async () => {
    setStatus("saving");
    try {
      const nextSubject = subject.trim() || DEFAULT_SHARE_EMAIL_TEMPLATE.subject;
      const nextBody = body.trim() || DEFAULT_SHARE_EMAIL_TEMPLATE.body;
      const supabase = createClient();
      const { error } = await supabase.from("app_config").upsert(
        [
          { key: SHARE_EMAIL_TEMPLATE_KEYS.subject, value: nextSubject },
          { key: SHARE_EMAIL_TEMPLATE_KEYS.body, value: nextBody },
        ],
        { onConflict: "key" },
      );
      if (error) throw error;
      setSubject(nextSubject);
      setBody(nextBody);
      setSavedSubject(nextSubject);
      setSavedBody(nextBody);
      setEditing(false);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">Email de partage d&apos;offre</p>
          <p className="text-xs text-slate-500">
            Modèle utilisé par le bouton “Préparer les emails” dans une offre.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {status === "saved" ? "Enregistré" : "Modifier"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={status === "saving"}
              className="rounded-lg bg-brand-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
            >
              {status === "saving" ? "…" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-medium text-slate-600">
          Sujet
          <input
            type="text"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setStatus("idle");
            }}
            readOnly={!editing}
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition ${
              editing
                ? "border-slate-300 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                : "border-transparent bg-slate-50 text-slate-600"
            }`}
          />
        </label>

        <label className="block text-xs font-medium text-slate-600">
          Corps du message
          <textarea
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setStatus("idle");
            }}
            readOnly={!editing}
            rows={8}
            className={`mt-1 w-full resize-y rounded-lg border px-3 py-2 font-mono text-sm leading-5 transition ${
              editing
                ? "border-slate-300 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                : "border-transparent bg-slate-50 text-slate-600"
            }`}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Variables: {"{client}"}, {"{participants}"}, {"{dates_courtes}"}, {"{dates}"}, {"{type_sejour}"}, {"{transmis_par}"}, {"{lien}"}, {"{date_jour}"}, {"{date_creation}"}, {"{hotel}"}, {"{station}"}
          </p>
          {editing && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Réinitialiser le modèle
            </button>
          )}
          {status === "error" && <span className="text-xs text-rose-600">Erreur</span>}
        </div>
      </div>
    </div>
  );
}
