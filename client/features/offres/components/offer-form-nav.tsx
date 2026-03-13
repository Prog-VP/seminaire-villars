"use client";

export function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: { key: string; label: string }[];
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <nav className="mb-8 flex items-center">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <div key={step.label} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => isCompleted && onStepClick(index)}
              disabled={!isCompleted}
              className={`flex items-center gap-2 ${isCompleted ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-brand-900 text-white"
                    : isCurrent
                      ? "ring-2 ring-brand-900 text-brand-900 bg-white"
                      : "bg-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isCurrent
                    ? "text-brand-900"
                    : isCompleted
                      ? "text-slate-900"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`mx-3 h-px flex-1 ${
                  index < currentStep ? "bg-brand-900" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const isLast = currentStep === totalSteps - 1;
  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentStep === 0}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Précédent
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={isLast ? onSubmit : onNext}
        className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLast ? (isSubmitting ? "Enregistrement..." : submitLabel) : "Suivant"}
      </button>
    </div>
  );
}

export function ActionButtons({
  onCancel,
  cancelLabel,
  onDelete,
  deleteLabel,
  isDeleteLoading,
  isSubmitting,
  submitLabel,
  className = "",
}: {
  onCancel?: () => void;
  cancelLabel: string;
  onDelete?: () => void;
  deleteLabel: string;
  isDeleteLoading: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end ${className}`}
    >
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleteLoading || isSubmitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleteLoading ? "Suppression..." : deleteLabel}
        </button>
      )}
      {onCancel && (
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Enregistrement..." : submitLabel}
      </button>
    </div>
  );
}
