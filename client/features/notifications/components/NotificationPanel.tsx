"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "../context";

export function NotificationNavLink({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const isActive = pathname === "/notifications";

  return (
    <Link
      href="/notifications"
      aria-current={isActive ? "page" : undefined}
      aria-label={isCollapsed ? "Dernières nouvelles" : undefined}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-brand-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      } ${isCollapsed ? "justify-center px-2" : ""}`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition ${
          isActive
            ? "bg-white/15 text-white"
            : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
        } ${isCollapsed ? "" : "shrink-0"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
        </svg>
      </span>
      {!isCollapsed && (
        <span className="text-sm font-medium leading-tight">Dernières nouvelles</span>
      )}
      {unreadCount > 0 && (
        <span className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold leading-none text-white ${isCollapsed ? "absolute -right-0.5 -top-0.5" : "ml-auto"}`}>
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
