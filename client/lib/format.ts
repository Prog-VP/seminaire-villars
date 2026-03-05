const dateFmt = new Intl.DateTimeFormat("fr-CH", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-CH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return dateFmt.format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    return dateTimeFmt.format(new Date(value));
  } catch {
    return value;
  }
}

export function humanFileSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
