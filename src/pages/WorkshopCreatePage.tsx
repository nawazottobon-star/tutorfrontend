import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { readStoredSession } from "@/utils/session";
import { API_BASE_URL } from "@/lib/api";
import { Trash2, Plus, Layout, Clock, Video, Users, GraduationCap, ChevronLeft, HelpCircle, Calendar as CalendarIcon } from "lucide-react";
import "@/workshops.css";

interface Question {
    id: string;
    number: number;
    text: string;
    type: 'mcq' | 'text';
    options: string[] | null;
}

interface Course {
    courseId: string;
    title: string;
}

export default function WorkshopCreatePage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const session = readStoredSession();
    const [questions, setQuestions] = useState<Question[]>([]);

    const headers = useMemo(() => {
        if (!session?.accessToken) return undefined;
        return { 'Authorization': `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' };
    }, [session?.accessToken]);

    // Fetch tutor's courses to anchor the workshop
    const { data: coursesResponse } = useQuery<{ courses: Course[] }>({
        queryKey: ['tutor-courses'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/tutors/me/courses`, { headers });
            if (!res.ok) throw new Error("Failed to fetch courses");
            return res.json();
        },
        enabled: !!headers
    });

    const courses = coursesResponse?.courses ?? [];

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            title: "",
            topic: "",
            description: "",
            googleMeetLink: "",
            maxSeats: "",
            scheduledAt: "",
            courseId: ""
        }
    });

    const createWorkshopMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/api/workshops`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create workshop");
            return res.json();
        }
    });

    const saveQuestionsMutation = useMutation({
        mutationFn: async ({ workshopId, questions }: { workshopId: string, questions: any[] }) => {
            const res = await fetch(`${API_BASE_URL}/api/workshops/${workshopId}/questions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ questions })
            });
            if (!res.ok) throw new Error("Failed to save questions");
            return res.json();
        }
    });

    const onSubmit = async (data: any) => {
        if (questions.length === 0) {
            toast({ title: "Questions required", description: "Please add at least one registration question.", variant: "destructive" });
            return;
        }

        try {
            console.log("Submitting workshop data:", data);
            const { workshopId } = await createWorkshopMutation.mutateAsync(data);
            console.log("Workshop created successfully. ID:", workshopId);

            console.log("Saving questions payload:", questions);
            await saveQuestionsMutation.mutateAsync({ workshopId, questions });
            console.log("Questions saved successfully.");

            toast({ title: "Workshop Created! 🚀", description: "Your workshop is live and ready for registrations." });
            setLocation('/tutors');
        } catch (error) {
            console.error("Submit pipeline failed:", error);
            toast({ title: "Error", description: `Something went wrong: ${error}`, variant: "destructive" });
        }
    };

    const addQuestion = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        setQuestions([...questions, {
            id: newId,
            number: questions.length + 1,
            text: "",
            type: 'text',
            options: null
        }]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id).map((q, i) => ({ ...q, number: i + 1 })));
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E1E8EE] via-[#F0F4F7] to-[#F8FAFC] pb-20 font-sans">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    onClick={() => setLocation('/tutors')}
                    className="mb-8 hover:bg-white/50 rounded-2xl transition-all duration-300 text-slate-500 font-bold"
                >
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back to Dashboard
                </Button>

                <div className="flex items-center gap-5 mb-12">
                    <div className="clay-card p-4 text-blue-600 bg-white">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1F2937] tracking-tight">Conduct a Workshop</h1>
                        <p className="text-slate-600 font-bold mt-1">Design your premium learning experience.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
                    {/* Basic Details */}
                    <div className="clay-card p-10 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <Layout className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Core Details</h2>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-[13px] font-black uppercase tracking-wider text-slate-600 ml-1">Workshop Title</Label>
                                <input
                                    {...register("title", { required: true })}
                                    placeholder="e.g. Master Class on System Design"
                                    className="clay-input w-full h-14 px-5 font-bold text-slate-800 placeholder:text-slate-400"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[13px] font-black uppercase tracking-wider text-slate-600 ml-1">Anchor Course</Label>
                                <Select onValueChange={(val) => setValue("courseId", val)} required>
                                    <SelectTrigger className="clay-input h-14 border-none shadow-none focus:ring-0 px-5 font-bold text-slate-800">
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                        {courses.map(c => (
                                            <SelectItem key={c.courseId} value={c.courseId} className="rounded-xl font-bold py-3">{c.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[13px] font-black uppercase tracking-wider text-slate-600 ml-1">Workshop Topic</Label>
                            <input
                                {...register("topic", { required: true })}
                                placeholder="e.g. Scalability, Sharding, and Load Balancing"
                                className="clay-input w-full h-14 px-5 font-bold text-slate-800 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[13px] font-black uppercase tracking-wider text-slate-600 ml-1">Short Description</Label>
                            <textarea
                                {...register("description", { required: true })}
                                placeholder="Tell learners what they will learn in this session..."
                                className="clay-input w-full min-h-[120px] p-5 font-bold text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Logistics */}
                    <div className="clay-card p-10 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Logistics</h2>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-[13px] font-black uppercase tracking-wider text-slate-600 ml-1">Google Meet Link</Label>
                                <div className="relative">
                                    <Video className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                    <input
                                        {...register("googleMeetLink", { required: true })}
                                        placeholder="https://meet.google.com/abc-xyz-def"
                                        className="clay-input w-full h-14 pl-12 pr-5 font-bold text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[13px] font-black uppercase tracking-wider text-slate-600 ml-1">Date & Time</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                    <input
                                        type="datetime-local"
                                        {...register("scheduledAt", { required: true })}
                                        className="clay-input w-full h-14 pl-12 pr-5 font-bold text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-[13px] font-black uppercase tracking-wider text-slate-600 ml-1">Max Seats (Optional)</Label>
                                <div className="relative">
                                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                    <input
                                        type="number"
                                        {...register("maxSeats")}
                                        placeholder="e.g. 50"
                                        className="clay-input w-full h-14 pl-12 pr-5 font-bold text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration Questions */}
                    <div className="clay-card p-10 space-y-8">
                        <div className="flex flex-row items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registration Form</h2>
                                    <p className="text-[12px] font-bold text-slate-400">Collect intent and information from learners.</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={addQuestion}
                                className="clay-btn-blue h-11 px-6 shadow-sm"
                            >
                                <Plus className="w-5 h-5 mr-1" /> Add
                            </Button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="py-20 text-center clay-input bg-slate-50/30">
                                <p className="text-slate-400 font-bold">No questions added yet. Click 'Add' to start building.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="clay-card p-8 bg-white/50 relative group">
                                        <div className="flex gap-6">
                                            <div className="clay-card w-12 h-12 flex items-center justify-center font-black text-xl text-blue-500 bg-white shrink-0">
                                                {q.number}
                                            </div>
                                            <div className="flex-1 space-y-6">
                                                <input
                                                    value={q.text}
                                                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                                    placeholder="Type your question here..."
                                                    className="clay-input w-full h-12 px-5 font-bold text-slate-800 placeholder:text-slate-400"
                                                />
                                                <div className="flex items-center gap-6">
                                                    <Select
                                                        value={q.type}
                                                        onValueChange={(val: any) => updateQuestion(q.id, 'type', val)}
                                                    >
                                                        <SelectTrigger className="clay-input w-[200px] h-11 border-none font-bold text-slate-500 px-5">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-none shadow-xl">
                                                            <SelectItem value="text" className="rounded-xl font-bold py-2">Short Answer</SelectItem>
                                                            <SelectItem value="mcq" className="rounded-xl font-bold py-2">Multiple Choice</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    {q.type === 'mcq' && (
                                                        <input
                                                            placeholder="Options (comma separated)"
                                                            className="clay-input flex-1 h-11 px-5 font-bold text-slate-800 placeholder:text-slate-400"
                                                            onChange={(e) => updateQuestion(q.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                        />
                                                    )}

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeQuestion(q.id)}
                                                        className="w-11 h-11 rounded-2xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-all ml-auto"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-6 pt-8">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setLocation('/tutors')}
                            className="h-14 px-10 font-black text-slate-400 hover:text-slate-600 transition-all"
                        >
                            Back out
                        </Button>
                        <Button
                            type="submit"
                            className="clay-btn-blue h-14 px-12 text-lg font-black tracking-tight"
                            disabled={createWorkshopMutation.isPending}
                        >
                            {createWorkshopMutation.isPending ? "Launching..." : "Launch Workshop 🚀"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
