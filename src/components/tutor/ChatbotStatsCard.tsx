/**
 * Chatbot Interaction Statistics Component
 * 
 * Displays chatbot usage stats and question type analysis for learners
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, HelpCircle, Lightbulb } from 'lucide-react';
import { fetchChatbotStats, fetchQuestionAnalysis } from '@/lib/chatbotStatsService';
import type { ChatbotModuleStats, QuestionAnalysis } from '@/lib/chatbotStatsService';

interface ChatbotStatsCardProps {
    courseId: string;
    cohortId?: string | null;
    headers?: Headers;
}

export function ChatbotStatsCard({ courseId, cohortId, headers }: ChatbotStatsCardProps) {
    console.log('[ChatbotStatsCard] Props:', { courseId, cohortId, hasHeaders: Boolean(headers) });

    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError
    } = useQuery<ChatbotModuleStats[]>({
        queryKey: ['chatbot-stats', courseId, cohortId],
        enabled: Boolean(courseId),
        queryFn: () => fetchChatbotStats(courseId, cohortId || undefined, undefined, headers)
    });

    const {
        data: analysis,
        isLoading: analysisLoading
    } = useQuery<QuestionAnalysis>({
        queryKey: ['question-analysis', courseId, cohortId],
        enabled: Boolean(courseId),
        queryFn: () => fetchQuestionAnalysis(courseId, cohortId || undefined, undefined, undefined, headers)
    });

    console.log('[ChatbotStatsCard] State:', {
        stats,
        statsLoading,
        statsError,
        statsLength: stats?.length
    });

    const totalSessions = stats?.reduce((sum, module) =>
        sum + module.topics.reduce((topicSum, topic) => topicSum + topic.sessionCount, 0), 0
    ) || 0;

    const totalMessages = stats?.reduce((sum, module) =>
        sum + module.topics.reduce((topicSum, topic) => topicSum + topic.messageCount, 0), 0
    ) || 0;

    if (statsLoading || analysisLoading) {
        return (
            <Card className="border-[#E6EAF0] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <CardHeader>
                    <CardTitle className="text-[#1A202C]">Chatbot Interaction Stats</CardTitle>
                    <p className="text-sm text-[#718096]">Loading chatbot usage data...</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!stats || stats.length === 0) {
        return (
            <Card className="border-[#E6EAF0] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <CardHeader>
                    <CardTitle className="text-[#1A202C]">Chatbot Interaction Stats</CardTitle>
                    <p className="text-sm text-[#718096]">No chatbot activity yet</p>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-[#718096]">
                        Learners haven't used the chatbot for this course yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-[#E6EAF0] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <CardHeader>
                <CardTitle className="text-[#1A202C]">Chatbot Interaction Stats</CardTitle>
                <p className="text-sm text-[#718096]">
                    {totalSessions} total sessions • {totalMessages} questions asked
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Question Type Analysis */}
                {analysis && analysis.totalQuestions > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-[#3182CE]" />
                                <h3 className="text-sm font-semibold text-[#1A202C]">Question Types</h3>
                            </div>
                            <span className="text-xs text-[#718096]">{analysis.totalQuestions} total questions</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="h-3.5 w-3.5 text-[#38A169]" />
                                    <span className="text-[#1A202C]">Predefined questions</span>
                                </div>
                                <span className="font-semibold text-[#38A169]">{analysis.predefinedPercentage}%</span>
                            </div>
                            <Progress value={analysis.predefinedPercentage} className="h-2" />
                            <p className="text-xs text-[#718096]">
                                {analysis.predefinedQuestions} questions matched suggested prompts
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-[#D97706]" />
                                    <span className="text-[#1A202C]">Custom questions</span>
                                </div>
                                <span className="font-semibold text-[#D97706]">{analysis.customPercentage}%</span>
                            </div>
                            <Progress value={analysis.customPercentage} className="h-2" />
                            <p className="text-xs text-[#718096]">
                                {analysis.customQuestions} unique questions from learners
                            </p>
                        </div>
                    </div>
                )}

                {/* Session Stats by Module */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[#1A202C]">Sessions by Module</h3>
                    <div className="space-y-3">
                        {stats.map((module) => (
                            <div key={module.moduleNo} className="rounded-lg border border-[#E2E8F0] p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-[#1A202C]">
                                        Module {module.moduleNo}: {module.moduleName}
                                    </h4>
                                    <span className="text-xs text-[#718096]">
                                        {module.topics.reduce((sum, t) => sum + t.sessionCount, 0)} sessions
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {module.topics.map((topic) => (
                                        <div key={topic.topicId} className="flex items-center justify-between text-xs">
                                            <span className="text-[#4A5568] truncate flex-1">{topic.topicName}</span>
                                            <div className="flex items-center gap-3 ml-2 shrink-0">
                                                <span className="text-[#718096]">{topic.sessionCount} sessions</span>
                                                <span className="text-[#718096]">•</span>
                                                <span className="text-[#718096]">{topic.messageCount} questions</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
