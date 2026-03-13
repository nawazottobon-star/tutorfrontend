import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { readStoredSession } from "@/utils/session";
import { useLocation } from "wouter";
import { 
    MessageSquare, 
    Send, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    History,
    Users,
    Star,
    Layout,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ColdCallPrompt = {
    promptId: string;
    promptText: string;
    helperText: string;
    isActive: boolean;
    createdAt: string;
};

type TopicOverview = {
    topicId: string;
    moduleNo: number;
    moduleName: string;
    topicNumber: number;
    topicName: string;
    activePrompt: ColdCallPrompt | null;
};

type LearnerResponse = {
    messageId: string;
    body: string;
    createdAt: string;
    user: { fullName: string; email: string };
    cohort: { name: string };
    prompt: { promptId: string; promptText: string; createdAt: string };
    _count: { stars: number };
};

type HistoricalPrompt = {
    promptId: string;
    promptText: string;
    isActive: boolean;
    createdAt: string;
    _count: { messages: number };
};

export default function ColdCallManager() {
    const session = readStoredSession();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();

    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const [selectedCohortId, setSelectedCohortId] = useState<string>("all");
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<"debate" | "history">("debate");
    const [newPromptText, setNewPromptText] = useState("");

    const headers = useMemo(() => {
        if (!session?.accessToken) return undefined;
        return { Authorization: `Bearer ${session.accessToken}` };
    }, [session]);

    // 0. Fetch Courses
    const { data: coursesData } = useQuery<{ courses: { courseId: string, title: string }[] }>({
        queryKey: ["tutor-courses"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/tutors/me/courses", undefined, { headers });
            return res.json();
        },
        enabled: !!headers
    });

    useMemo(() => {
        if (coursesData?.courses?.length && !selectedCourseId) {
            setSelectedCourseId(coursesData.courses[0].courseId);
        }
    }, [coursesData, selectedCourseId]);

    // 1. Fetch Overview
    const { data: overviewData, isLoading: overviewLoading } = useQuery<{ topics: TopicOverview[] }>({
        queryKey: ["cold-call-overview", selectedCourseId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/cold-call/overview/${selectedCourseId}`, undefined, { headers });
            return res.json();
        },
        enabled: !!selectedCourseId && !!session?.accessToken
    });

    // Group topics by module
    const groupedModules = useMemo(() => {
        const sorted = [...(overviewData?.topics || [])].sort((a, b) =>
            a.moduleNo !== b.moduleNo ? a.moduleNo - b.moduleNo : a.topicNumber - b.topicNumber
        );

        const groups: Record<number, { name: string, topics: TopicOverview[] }> = {};
        sorted.forEach(t => {
            if (!groups[t.moduleNo]) groups[t.moduleNo] = { name: t.moduleName, topics: [] };
            groups[t.moduleNo].topics.push(t);
        });
        return groups;
    }, [overviewData]);

    // 2. Fetch Responses
    const { data: responsesData, isLoading: responsesLoading } = useQuery<{ responses: LearnerResponse[] }>({
        queryKey: ["cold-call-responses", selectedTopicId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/cold-call/responses/${selectedTopicId}`, undefined, { headers });
            return res.json();
        },
        enabled: !!selectedTopicId && !!headers
    });

    // 3. Fetch Prompt History
    const { data: promptHistoryData } = useQuery<{ prompts: HistoricalPrompt[] }>({
        queryKey: ["cold-call-history", selectedTopicId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/cold-call/prompts/${selectedTopicId}/history`, undefined, { headers });
            return res.json();
        },
        enabled: !!selectedTopicId && !!headers
    });

    const updatePromptMutation = useMutation({
        mutationFn: async (data: { topicId: string, promptText: string }) => {
            const res = await apiRequest("POST", "/api/cold-call/update", data, { headers });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cold-call-overview"] });
            queryClient.invalidateQueries({ queryKey: ["cold-call-history"] });
            queryClient.invalidateQueries({ queryKey: ["cold-call-responses"] });
            toast({ title: "Success", description: "New question published instantly." });
            setIsEditing(false);
            setNewPromptText("");
        },
        onError: (err: any) => {
            toast({ 
                variant: "destructive", 
                title: "Launch Failed", 
                description: err.message || "Something went wrong while publishing the question." 
            });
        }
    });

    const selectedTopic = overviewData?.topics.find(t => t.topicId === selectedTopicId);

    const filteredResponses = useMemo(() => {
        let list = responsesData?.responses || [];

        // If in FEED mode, only show responses for the CURRENT active prompt
        if (viewMode === 'debate' && selectedTopic?.activePrompt) {
            list = list.filter(r => r.prompt.promptId === selectedTopic.activePrompt?.promptId);
        }
        // In HISTORY mode, we show everything

        if (selectedCohortId !== "all") {
            list = list.filter(r => r.cohort.name === selectedCohortId);
        }
        return list;
    }, [responsesData, selectedCohortId, viewMode, selectedTopic]);

    const cohorts = useMemo(() => {
        const set = new Set<string>();
        responsesData?.responses.forEach(r => set.add(r.cohort.name));
        return Array.from(set).sort();
    }, [responsesData]);

    // Helper for avatar colors
    const getAvatarColor = (name: string) => {
        const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600'];
        const charCode = name.charCodeAt(0) || 0;
        return colors[charCode % colors.length];
    };

    return (
        <SiteLayout>
            <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8">

                {/* NAV BAR */}
                <nav className="mb-8 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => setLocation('/tutors')}
                        className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Button>

                    <div className="flex items-center gap-3">
                        <Select value={selectedCourseId || ""} onValueChange={setSelectedCourseId}>
                            <SelectTrigger className="w-[280px] bg-white border-slate-200 h-10 rounded-xl shadow-sm focus:ring-indigo-500">
                                <SelectValue placeholder="Select Course" />
                            </SelectTrigger>
                            <SelectContent>
                                {coursesData?.courses.map(c => <SelectItem key={c.courseId} value={c.courseId}>{c.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </nav>

                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Cold Call Command</h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-12 italic text-sm">Managing the loop of real-time learner engagement.</p>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8 h-[calc(100vh-280px)] min-h-[650px]">

                    {/* LEFT SIDEBAR: Course Map (Grouped) */}
                    <Card className="col-span-4 bg-white border-slate-200 shadow-xl overflow-hidden flex flex-col rounded-3xl">
                        <CardHeader className="border-b bg-slate-50/30 px-6 py-4 shrink-0">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layout className="w-4 h-4" /> Course Curriculum Map
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                            <CardContent className="p-0">
                                {Object.entries(groupedModules).map(([mNo, module]) => (
                                    <div key={mNo} className="mb-2">
                                        <div className="px-6 py-3 bg-slate-50/80 border-y border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                Module {mNo}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 italic max-w-[150px] truncate text-right">
                                                {module.name}
                                            </span>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {module.topics.map((topic) => (
                                                <button
                                                    key={topic.topicId}
                                                    onClick={() => {
                                                        setSelectedTopicId(topic.topicId);
                                                        setNewPromptText(topic.activePrompt?.promptText || "");
                                                        setIsEditing(false);
                                                        setViewMode("debate");
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-6 py-4 transition-all hover:bg-slate-50 flex items-center justify-between group relative",
                                                        selectedTopicId === topic.topicId ? "bg-indigo-50/50" : "bg-transparent"
                                                    )}
                                                >
                                                    {selectedTopicId === topic.topicId && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                                                    )}
                                                    <div className="flex gap-4 items-center pr-4">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] transition-all",
                                                            selectedTopicId === topic.topicId
                                                                ? "bg-indigo-600 text-white shadow-md rotate-3"
                                                                : topic.activePrompt
                                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                                        )}>
                                                            {topic.moduleNo}.{topic.topicNumber}
                                                        </div>
                                                        <h4 className={cn(
                                                            "font-bold text-[13px] leading-tight transition-colors",
                                                            selectedTopicId === topic.topicId ? "text-indigo-900" : "text-slate-600 group-hover:text-slate-900"
                                                        )}>
                                                            {topic.topicName}
                                                        </h4>
                                                    </div>
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        topic.activePrompt ? "bg-emerald-500" : "bg-amber-400"
                                                    )} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </ScrollArea>
                    </Card>

                    {/* MAIN CONTENT Area */}
                    <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
                        
                        {!selectedTopicId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-6 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                                <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                                    <Layout className="w-12 h-12 opacity-20" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-500">No Topic Selected</p>
                                    <p className="text-sm mt-1">Select a topic from the course map to begin management.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* TOP: Active Prompt & Editor */}
                                <Card className="border-slate-200 shadow-xl overflow-hidden bg-white shrink-0 rounded-[2.5rem]">
                                    <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-slate-100 px-6 py-3">
                                        <div className="flex items-center gap-6">
                                            <div className="hidden sm:block">
                                                <CardTitle className="text-base font-black text-slate-900">Current Question</CardTitle>
                                                <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Course Player: Live</CardDescription>
                                            </div>
                                            <div className="h-6 w-px bg-slate-100 hidden sm:block" />
                                            <div className="flex p-0.5 bg-slate-100 rounded-lg">
                                                <button 
                                                    onClick={() => setViewMode('debate')}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[10px] font-black rounded-md transition-all",
                                                        viewMode === 'debate' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                                    )}
                                                >
                                                    FEED
                                                </button>
                                                <button 
                                                    onClick={() => setViewMode('history')}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[10px] font-black rounded-md transition-all",
                                                        viewMode === 'history' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                                    )}
                                                >
                                                    HISTORY
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedTopic?.activePrompt && !isEditing && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => {setIsEditing(true); setViewMode('debate')}}
                                                    className="rounded-lg text-xs font-bold h-8 px-3 text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    New Question
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <AnimatePresence mode="wait">
                                            {viewMode === 'history' ? (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    key="history"
                                                    className="space-y-4"
                                                >
                                                    <ScrollArea className="h-[140px]">
                                                        <div className="space-y-2 pr-4">
                                                            {promptHistoryData?.prompts.map((p) => (
                                                                <div key={p.promptId} className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all flex items-center justify-between">
                                                                    <div className="flex-1 min-w-0 pr-6">
                                                                        <p className="text-sm font-bold text-slate-700 leading-snug truncate">"{p.promptText}"</p>
                                                                        <div className="flex items-center gap-3 mt-1.5 font-bold">
                                                                            <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                                                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                                            <span className="text-[10px] text-indigo-500 uppercase tracking-wider">{p._count.messages} Responses</span>
                                                                        </div>
                                                                    </div>
                                                                    {p.isActive ? (
                                                                        <Badge className="bg-emerald-500 text-white border-transparent text-[9px] font-black uppercase px-2 py-0.5 rounded-md">Active</Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">Archived</Badge>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </motion.div>
                                            ) : isEditing || !selectedTopic?.activePrompt ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    key="editor"
                                                    className="space-y-6"
                                                >
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-indigo-600">
                                                                <Send className="w-4 h-4" />
                                                                <span className="text-xs font-black uppercase tracking-[2px]">Awaiting New Prompt</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 italic">Quotes will be added automatically</span>
                                                        </div>
                                                        <Textarea 
                                                            placeholder="Type your question here (e.g. How does state management work?)"
                                                            className="min-h-[80px] text-sm font-medium rounded-2xl border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 p-4 leading-relaxed transition-all bg-slate-50/30"
                                                            value={newPromptText}
                                                            onChange={(e) => setNewPromptText(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-3 pt-2">
                                                        {selectedTopic?.activePrompt && (
                                                            <Button variant="ghost" className="rounded-xl font-bold h-11 px-6" onClick={() => setIsEditing(false)}>Cancel</Button>
                                                        )}
                                                        <Button 
                                                            className="bg-slate-900 hover:bg-black text-white rounded-xl px-8 h-11 shadow-lg shadow-slate-200 font-bold"
                                                            disabled={!newPromptText.trim() || updatePromptMutation.isPending}
                                                            onClick={() => updatePromptMutation.mutate({ topicId: selectedTopicId, promptText: newPromptText })}
                                                        >
                                                            {updatePromptMutation.isPending ? "Syncing..." : "Launch Topic Prompt"}
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    key="display"
                                                    className="space-y-4"
                                                >
                                                    <div className="relative p-4 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100">
                                                        <div className="absolute top-2 right-2 text-white/10">
                                                            <MessageSquare className="w-8 h-8" />
                                                        </div>
                                                        <p className="text-base md:text-lg text-white font-bold leading-snug relative z-10 italic">
                                                            "{selectedTopic.activePrompt.promptText}"
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                                <Clock className="w-3 h-3" /> 
                                                                {new Date(selectedTopic.activePrompt.createdAt).toLocaleDateString()}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                                Live Now
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>

                                {/* BOTTOM: Real-time Responses */}
                                <Card className="flex-1 min-h-0 border-slate-200 shadow-2xl shadow-slate-200/50 flex flex-col rounded-[2.5rem] overflow-hidden bg-white">
                                    <CardHeader className="px-8 py-6 border-b border-slate-100 flex flex-row items-center justify-between shrink-0 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                                        <div className="flex items-center gap-6">
                                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Learner Debate</CardTitle>
                                            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                                            <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
                                                <SelectTrigger className="w-[200px] h-10 text-xs font-bold rounded-xl bg-slate-50 border-transparent shadow-inner">
                                                    <SelectValue placeholder="All Cohorts" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Student Cohorts</SelectItem>
                                                    {cohorts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="px-4 py-1.5 bg-indigo-50 rounded-full flex items-center gap-2 border border-indigo-100 shadow-sm">
                                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">{filteredResponses.length} Responses</span>
                                        </div>
                                    </CardHeader>
                                    <ScrollArea className="flex-1">
                                        <CardContent className="px-8 py-5">
                                            {responsesLoading ? (
                                                <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-sm font-bold uppercase tracking-widest">Hydrating Debate Stream...</p>
                                                </div>
                                            ) : filteredResponses.length === 0 ? (
                                                <div className="py-20 text-center flex flex-col items-center gap-4 grayscale opacity-50">
                                                    <div className="p-8 bg-slate-100 rounded-[2rem]">
                                                        <MessageSquare className="w-16 h-16 text-slate-400" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-600 uppercase tracking-widest">Radio Silence</p>
                                                        <p className="text-sm text-slate-400">No students have weighed in on this topic yet.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {filteredResponses.map((res) => (
                                                        <div key={res.messageId} className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 p-3 flex flex-col gap-2 overflow-hidden">
                                                            {/* Background Decoration */}
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
                                                            
                                                            <div className="flex justify-between items-start relative z-10">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-md rotate-3 group-hover:rotate-0 transition-transform",
                                                                        getAvatarColor(res.user.fullName)
                                                                    )}>
                                                                        {res.user.fullName[0].toUpperCase()}
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="font-black text-slate-900 text-base flex items-center gap-2">
                                                                            {res.user.fullName}
                                                                            <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none text-[9px] font-black tracking-tighter rounded px-1.5 h-4">ID: {res.user.email.split('@')[0]}</Badge>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                                                                                {res.cohort.name}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400 font-bold">•</span>
                                                                            <span className="text-[10px] text-slate-400 font-bold italic">
                                                                                {new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl text-amber-600 border border-amber-100/50 shadow-sm transition-transform active:scale-90 cursor-default">
                                                                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                                                        <span className="font-black text-sm">{res._count.stars}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="relative pl-16 pr-4">
                                                                {/* Decorative line */}
                                                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-transparent rounded-full" />
                                                                
                                                                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl rounded-tl-none text-slate-800 text-sm leading-relaxed font-medium shadow-inner group-hover:bg-white transition-colors">
                                                                    {res.body}
                                                                </div>
                                                                
                                                                {viewMode === 'history' && (
                                                                    <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">
                                                                        <AlertCircle className="w-3 h-3" />
                                                                        Replied to: "{res.prompt.promptText}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </ScrollArea>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </SiteLayout>
    );
}
