"use client";

import Link from "next/link";
import { useNotifications, type NotificationItem } from "../context";

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-CH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(items: NotificationItem[]) {
  const groups: { label: string; items: NotificationItem[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const item of items) {
    const d = new Date(item.createdAt);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (d.getTime() === today.getTime()) label = "Aujourd'hui";
    else if (d.getTime() === yesterday.getTime()) label = "Hier";
    else label = d.toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" });

    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return groups;
}

export function NotificationsPage() {
  const { notifications, unreadCount, clearNotifications, markAsRead, loadMore, loadingMore, hasMore } = useNotifications();

  const groups = groupByDate(notifications);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">
            Réponses d&apos;hôtels et événements récents.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={clearNotifications}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Tout marquer comme lu
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold leading-none text-white">
              {unreadCount}
            </span>
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-slate-400">
              <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">Aucune notification récente.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {group.items.map((n, i) => (
                  <Link
                    key={n.id}
                    href={`/offres/${n.offerId}?tab=responses`}
                    onClick={() => markAsRead(n.id)}
                    className={`flex gap-4 px-5 py-4 transition hover:bg-slate-50 ${i > 0 ? "border-t border-slate-100" : ""}`}
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                        <path d="M3.505 2.365A41.369 41.369 0 0 1 9 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 0 0-.577-.069 43.141 43.141 0 0 0-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 0 1 5 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914Z" />
                        <path d="M14 6c.762 0 1.52.02 2.272.06C17.226 6.11 18 7.13 18 8.138v2.844c0 1.009-.774 2.028-1.728 2.079A42.23 42.23 0 0 1 14 13.15v3.1a.75.75 0 0 1-1.28.53l-2.982-2.982A11.496 11.496 0 0 1 7.5 13.5v-2.24c0-1.413.67-2.735 1.76-3.562A2.5 2.5 0 0 1 11 6h3Z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">
                          Réponse de {n.hotelName}
                          {n.respondentName ? ` (${n.respondentName})` : ""}
                        </p>
                        <span className="shrink-0 text-xs text-slate-400">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      {n.offerLabel && (
                        <p className="mt-0.5 text-sm text-slate-500">
                          Offre : {n.offerLabel}
                        </p>
                      )}
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">
                        {n.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingMore ? "Chargement..." : "Charger plus ancien"}
              </button>
            </div>
          )}

          {!hasMore && notifications.length > 0 && (
            <p className="pt-2 text-center text-xs text-slate-300">
              Toutes les notifications ont été chargées.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
