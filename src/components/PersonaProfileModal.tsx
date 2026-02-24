import React from "react";

type PersonaQuestion = {
  id: string;
  prompt: string;
  helper?: string;
  placeholder?: string;
};

type PersonaProfileModalProps = {
  isOpen: boolean;
  questions: PersonaQuestion[];
  responses: Record<string, string>;
  onResponseChange: (id: string, value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  error?: string | null;
};

export default function PersonaProfileModal({
  isOpen,
  questions,
  responses,
  onResponseChange,
  onSubmit,
  onSkip,
  isSubmitting,
  canSubmit,
  error,
}: PersonaProfileModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[#bf2f1f]">Personalize your tutor</p>
          <h2 className="text-2xl font-bold text-[#111827]">Tell us how you learn best</h2>
          <p className="text-sm text-[#4a4845]">
            Your answers help the tutor explain concepts in the way that feels most natural to you.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-semibold text-[#1e293b]">
                {index + 1}. {question.prompt}
              </label>
              {question.helper && <p className="text-xs text-[#6b7280]">{question.helper}</p>}
              <textarea
                value={responses[question.id] ?? ""}
                onChange={(event) => onResponseChange(question.id, event.target.value)}
                placeholder={question.placeholder}
                className="min-h-[90px] w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#111827] focus:border-[#bf2f1f] focus:outline-none"
              />
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-semibold text-[#4a4845] hover:text-[#111827]"
            disabled={isSubmitting}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className="rounded-xl bg-[#bf2f1f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a62619] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save and continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
