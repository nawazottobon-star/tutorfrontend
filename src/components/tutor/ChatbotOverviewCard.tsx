/**
 * Chatbot Overview Card Component
 * 
 * Displays cohort-level aggregate statistics for chatbot activity,
 * including most active modules and curiosity hotspots.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Zap, BarChart3, TrendingUp } from 'lucide-react';
import { fetchModuleActivityOverview } from '@/lib/enhancedChatbotStatsService';
import type { ModuleActivity } from '@/lib/enhancedChatbotStatsService';

interface ChatbotOverviewCardProps {
    courseId: string;
    cohortId?: string | null;
    headers?: Headers;
}

export function ChatbotOverviewCard({ courseId, cohortId, headers }: ChatbotOverviewCardProps) {
    const {
        data: modules,
        isLoading,
        error
    } = useQuery<ModuleActivity[]>({
        queryKey: ['chatbot-module-overview', courseId, cohortId],
        enabled: Boolean(courseId) && Boolean(headers),
        queryFn: () => fetchModuleActivityOverview(courseId, cohortId || undefined, headers),
        retry: 1
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-100 bg-red-50/30 p-4">
                <p className="text-xs text-red-600 font-medium flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Failed to load module overview. Please try refreshing.
                </p>
            </Card>
        );
    }

    if (!modules || modules.length === 0) {
        return null; // Don't show anything if no activity
    }

    const totalSessions = modules.reduce((sum, m) => sum + m.totalSessions, 0);
    const totalQuestions = modules.reduce((sum, m) => sum + m.totalQuestions, 0);
    const avgCustomPercentage = Math.round(
        modules.reduce((sum, m) => sum + m.customQuestionPercentage, 0) / modules.length
    );

    // Get top 3 most active modules by sessions
    const mostActive = [...modules].sort((a, b) => b.totalSessions - a.totalSessions).slice(0, 3);

    // Get top 3 curiosity hotspots by custom percentage (min 2 questions)
    const curiosityHotspots = [...modules]
        .filter(m => m.totalQuestions >= 2)
        .sort((a, b) => b.customQuestionPercentage - a.customQuestionPercentage)
        .slice(0, 3);

    return (
        <div className="space-y-4">
            {/* High Level Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-[#E6EAF0] bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Total Sessions</p>
                            <p className="text-xl font-bold text-[#1A202C]">{totalSessions}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E6EAF0] bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Total Questions</p>
                            <p className="text-xl font-bold text-[#1A202C]">{totalQuestions}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E6EAF0] bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Custom Rate</p>
                            <p className="text-xl font-bold text-[#1A202C]">{avgCustomPercentage}%</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Most Active Modules */}
                <Card className="border-[#E6EAF0] bg-white shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <CardTitle className="text-sm font-semibold text-[#2D3748]">Activation Hotspots</CardTitle>
                        </div>
                        <p className="text-[10px] text-[#718096]">Modules with the most chatbot interactions</p>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {mostActive.map((module) => (
                            <div key={module.moduleNo} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-[#4A5568] truncate pr-4">
                                        M{module.moduleNo}: {module.moduleName}
                                    </span>
                                    <span className="text-[#718096] whitespace-nowrap">{module.totalSessions} sessions</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                                        style={{ width: `${(module.totalSessions / mostActive[0].totalSessions) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Curiosity Hotspots */}
                <Card className="border-[#E6EAF0] bg-white shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-orange-500" />
                            <CardTitle className="text-sm font-semibold text-[#2D3748]">Curiosity Hotspots</CardTitle>
                        </div>
                        <p className="text-[10px] text-[#718096]">Modules where learners ask their own questions</p>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {curiosityHotspots.map((module) => (
                            <div key={module.moduleNo} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-[#4A5568] truncate pr-4">
                                        M{module.moduleNo}: {module.moduleName}
                                    </span>
                                    <span className="text-[#718096] whitespace-nowrap">{module.customQuestionPercentage}% custom</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${module.customQuestionPercentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Add these to tailwind.config.js if you can, otherwise handle via style prop if needed
const Lightbulb = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
);
