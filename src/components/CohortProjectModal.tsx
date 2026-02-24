import React from "react";

export type CohortProjectPayload = {
  title: string;
  tagline: string;
  description: string;
  notes?: string | null;
};

type CohortProjectModalProps = {
  isOpen: boolean;
  project: CohortProjectPayload | null;
  batchNo?: number | null;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
};

export default function CohortProjectModal({
  isOpen,
  project,
  batchNo,
  isLoading,
  error,
  onClose,
}: CohortProjectModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[#bf2f1f]">Cohort project</p>
            <h2 className="text-2xl font-bold text-[#111827]">Project brief</h2>
            {batchNo ? (
              <p className="text-xs uppercase tracking-[0.2em] text-[#6b7280]">Batch {batchNo}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#4a4845] hover:text-[#111827]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4 text-sm text-[#4a4845]">
          {isLoading && <p>Loading project details...</p>}
          {!isLoading && error && <p className="text-sm text-red-600">{error}</p>}
          {!isLoading && !error && !project && (
            <p className="text-sm text-[#6b7280]">Project details are not available yet.</p>
          )}
          {!isLoading && !error && project && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#111827]">{project.title}</h3>
                <p className="text-sm text-[#6b7280]">{project.tagline}</p>
              </div>
              <p className="whitespace-pre-line leading-relaxed">{project.description}</p>
              {project.notes && (
                <div className="rounded-xl border border-[#f5c4b6] bg-[#fff8f4] p-4 text-[#782f1b]">
                  <span className="font-semibold text-[#C03520]">Notes:</span> {project.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
