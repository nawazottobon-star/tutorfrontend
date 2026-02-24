/**
 * Custom Questions Modal Component
 * 
 * Displays a detailed list of all custom questions asked by a specific learner,
 * including context about which module/topic they were curious about.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Clock, BookOpen, User } from 'lucide-react';
import { fetchLearnerCustomQuestions } from '@/lib/enhancedChatbotStatsService';
import type { CustomQuestion } from '@/lib/enhancedChatbotStatsService';

interface CustomQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerId: string;
  learnerName: string;
  courseId: string;
  cohortId?: string | null;
  headers?: Headers;
}

export function CustomQuestionsModal({
  isOpen,
  onClose,
  learnerId,
  learnerName,
  courseId,
  cohortId,
  headers
}: CustomQuestionsModalProps) {
  const {
    data: questions,
    isLoading,
    error
  } = useQuery<CustomQuestion[]>({
    queryKey: ['chatbot-custom-questions', courseId, learnerId, cohortId],
    enabled: isOpen && Boolean(learnerId),
    queryFn: () => fetchLearnerCustomQuestions(courseId, learnerId, cohortId || undefined, headers)
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold">Custom Questions Detail</DialogTitle>
          </div>
          <DialogDescription className="text-blue-100 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Showing questions asked by <span className="font-semibold text-white">{learnerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : !questions || questions.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No custom questions found for this learner.</p>
              <p className="text-xs text-slate-400 mt-1">They might be sticking to predefined prompts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium text-[#1A202C] italic leading-relaxed">
                        "{q.questionText}"
                      </p>

                      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#718096] bg-slate-50 px-2 py-1 rounded-md">
                          <BookOpen className="w-3 h-3 text-blue-400" />
                          <span className="font-medium">{q.moduleName}</span>
                          <span className="mx-0.5">•</span>
                          <span>{q.topicName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#718096] bg-slate-50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(q.askedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-[#4A5568] text-sm font-semibold rounded-lg transition-colors duration-200"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add these to tailwind.config.js if you can, otherwise handle via style prop if needed
const HelpCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
);
