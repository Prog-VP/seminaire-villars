type IconName = "edit" | "trash" | "check" | "close";

type IconButtonProps = {
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
};

export function IconButton({
  label,
  icon,
  onClick,
  disabled,
  tone = "default",
}: IconButtonProps) {
  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50";
  const danger =
    "border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-100";
  const defaultTone = "border-slate-200 hover:text-slate-900";
  return (
    <button
      type="button"
      className={`${base} ${tone === "danger" ? danger : defaultTone}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {renderIcon(icon)}
    </button>
  );
}

function renderIcon(name: IconName) {
  switch (name) {
    case "edit":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M15.232 5.232l3.536 3.536" />
          <path d="M4 20l4.243-.707 11.314-11.314-3.536-3.536L4.707 15.757 4 20z" />
        </svg>
      );
    case "trash":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M6 7h12" strokeLinecap="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" />
          <path d="M8 7V5h8v2" />
          <path d="M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "check":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "close":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
        >
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
