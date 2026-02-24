/**
 * Per-Learner Chatbot Statistics Card Component
 * 
 * Displays a list of learners in the selected cohort with their
 * individual chatbot interaction statistics and question patterns.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { User, MessageSquare, HelpCircle, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';
import { fetchPerLearnerStats } from '@/lib/enhancedChatbotStatsService';
import type { PerLearnerStats } from '@/lib/enhancedChatbotStatsService';
import { CustomQuestionsModal } from './CustomQuestionsModal';

interface PerLearnerStatsCardProps {
  courseId: string;
  cohortId?: string | null;
  headers?: Headers;
}

export function PerLearnerStatsCard({ courseId, cohortId, headers }: PerLearnerStatsCardProps) {
  const [expandedLearner, setExpandedLearner] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; learnerId: string; learnerName: string }>({
    isOpen: false,
    learnerId: '',
    learnerName: ''
  });

  const {
    data: learners,
    isLoading,
    error
  } = useQuery<PerLearnerStats[]>({
    queryKey: ['chatbot-learner-stats', courseId, cohortId],
    enabled: Boolean(courseId) && Boolean(headers),
    queryFn: () => fetchPerLearnerStats(courseId, cohortId || undefined, headers),
    retry: 1
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  if (error) {
    return (
      <Card className="border-red-100 bg-red-50 shadow-sm p-8 text-center">
        <div className="bg-red-100 p-3 rounded-full mb-3 inline-block">
          <User className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-red-700">Analytics Load Error</h3>
        <p className="text-xs text-red-600 mt-1">There was a problem fetching the individual learner stats. Please check the backend connection.</p>
      </Card>
    );
  }

  if (!learners || learners.length === 0) {
    return (
      <Card className="border-[#E6EAF0] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#1A202C]">Individual Learner Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-slate-50 p-3 rounded-full mb-3">
            <User className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm text-[#718096]">No individual learner activity recorded for this cohort.</p>
        </CardContent>
      </Card>
    );
  }

  const toggleExpand = (userId: string) => {
    setExpandedLearner(expandedLearner === userId ? null : userId);
  };

  const openCustomQuestions = (e: React.MouseEvent, learnerId: string, learnerName: string) => {
    e.stopPropagation();
    setModalConfig({
      isOpen: true,
      learnerId,
      learnerName
    });
  };

  return (
    <>
      <Card className="border-[#E6EAF0] bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100/50 bg-slate-50/30">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1A202C]">Individual Learner Activity</CardTitle>
              <p className="text-[10px] text-[#718096]">Detailed usage breakdown per student</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
              {learners.length} Active Learners
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {learners.map((learner) => {
            const isExpanded = expandedLearner === learner.userId;

            return (
              <div
                key={learner.userId}
                className="group hover:bg-slate-50/50 transition-colors duration-200"
              >
                {/* Summary Header Line */}
                <div
                  className="p-4 cursor-pointer flex items-center gap-4"
                  onClick={() => toggleExpand(learner.userId)}
                >
                  <div className="bg-slate-100 group-hover:bg-white p-2 rounded-full transition-colors duration-200">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#2D3748] truncate">{learner.userName}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-[#718096] flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-blue-400" /> {learner.totalSessions} sessions
                      </span>
                      <span className="text-[10px] text-[#718096] flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-purple-400" /> {learner.totalQuestions} questions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] text-[#718096]">Custom rate</span>
                      <span className={`text-xs font-bold ${learner.customPercentage > 50 ? 'text-orange-500' : 'text-[#2D3748]'}`}>
                        {learner.customPercentage}%
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                  </div>
                </div>

                {/* Expanded Details Area */}
                {isExpanded && (
                  <div className="px-14 pb-5 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      {/* Question Type Breakdown */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Behavior Pattern</span>
                          <button
                            onClick={(e) => openCustomQuestions(e, learner.userId, learner.userName)}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm border border-blue-100 transition-all hover:scale-105"
                          >
                            Review Custom Questions <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-[#4A5568]">
                              <span>Predefined Questions</span>
                              <span className="font-semibold">{learner.predefinedCount} ({learner.predefinedPercentage}%)</span>
                            </div>
                            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${learner.predefinedPercentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-[#4A5568]">
                              <span>Custom Questions</span>
                              <span className="font-semibold text-orange-600">{learner.customCount} ({learner.customPercentage}%)</span>
                            </div>
                            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                                style={{ width: `${learner.customPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Engagement Insights */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Insights</span>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-[11px]">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="text-[#4A5568]">Most active in <span className="font-semibold text-[#2D3748]">{learner.mostActiveModule || 'N/A'}</span></span>
                          </div>
                          <div className="flex items-start gap-2 text-[11px]">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="text-[#4A5568]">Last interacted on <span className="font-semibold text-[#2D3748]">{learner.lastActivityAt ? new Date(learner.lastActivityAt).toLocaleDateString() : 'N/A'}</span></span>
                          </div>
                          <div className="flex items-start gap-2 text-[11px]">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                            <span className="text-[#4A5568]">Engagement level: <span className="font-semibold text-[#2D3748]">{learner.totalSessions > 10 ? 'High' : learner.totalSessions > 3 ? 'Medium' : 'Low'}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <CustomQuestionsModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        learnerId={modalConfig.learnerId}
        learnerName={modalConfig.learnerName}
        courseId={courseId}
        cohortId={cohortId}
        headers={headers}
      />
    </>
  );
}
