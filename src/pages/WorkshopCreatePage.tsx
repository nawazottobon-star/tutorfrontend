import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { readStoredSession } from "@/utils/session";
import { API_BASE_URL } from "@/lib/api";
import {
    Trash2, Plus, Minus, ChevronLeft, HelpCircle,
    Calendar as CalendarIcon, Video, Users, Zap,
    BookOpen, Settings2,
} from "lucide-react";

interface Question {
    id: string;
    number: number;
    text: string;
    type: "mcq" | "text";
    options: string[] | null;
}
interface Course { courseId: string; title: string; }

export default function WorkshopCreatePage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const session = readStoredSession();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [seatCount, setSeatCount] = useState<number | "">("");

    const headers = useMemo(() => {
        if (!session?.accessToken) return undefined;
        return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
    }, [session?.accessToken]);

    const { data: coursesResponse } = useQuery<{ courses: Course[] }>({
        queryKey: ["tutor-courses"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/tutors/me/courses`, { headers });
            if (!res.ok) throw new Error("failed");
            return res.json();
        },
        enabled: !!headers,
    });
    const courses = coursesResponse?.courses ?? [];

    const { register, handleSubmit, setValue } = useForm({
        defaultValues: { title: "", topic: "", description: "", googleMeetLink: "", maxSeats: "", scheduledAt: "", courseId: "" },
    });

    const createM = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/api/workshops`, { method: "POST", headers, body: JSON.stringify(data) });
            if (!res.ok) throw new Error("failed");
            return res.json();
        },
    });
    const saveQsM = useMutation({
        mutationFn: async ({ workshopId, questions }: { workshopId: string; questions: any[] }) => {
            const res = await fetch(`${API_BASE_URL}/api/workshops/${workshopId}/questions`, { method: "POST", headers, body: JSON.stringify({ questions }) });
            if (!res.ok) throw new Error("failed");
            return res.json();
        },
    });

    const onSubmit = async (data: any) => {
        if (questions.length === 0) {
            toast({ title: "Questions required", description: "Add at least one registration question.", variant: "destructive" });
            return;
        }
        try {
            const { workshopId } = await createM.mutateAsync({
                ...data,
                maxSeats: seatCount !== "" ? String(seatCount) : undefined,
            });
            await saveQsM.mutateAsync({ workshopId, questions });
            toast({ title: "Workshop Created! 🚀", description: "Your workshop is live for registrations." });
            setLocation("/tutors");
        } catch (e) {
            toast({ title: "Error", description: `Something went wrong: ${e}`, variant: "destructive" });
        }
    };

    const addQ = () => setQuestions(p => [...p, { id: Math.random().toString(36).substr(2, 9), number: p.length + 1, text: "", type: "text", options: null }]);
    const removeQ = (id: string) => setQuestions(p => p.filter(q => q.id !== id).map((q, i) => ({ ...q, number: i + 1 })));
    const updateQ = (id: string, field: keyof Question, value: any) => setQuestions(p => p.map(q => q.id === id ? { ...q, [field]: value } : q));

    const isPending = createM.isPending || saveQsM.isPending;

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── TOP NAV ── */}
            <nav className="shrink-0 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10">
                <button onClick={() => setLocation("/tutors")}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Dashboard
                </button>

                {/* center title */}
                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                    <p className="text-[13px] font-black text-slate-800 tracking-tight">New Workshop</p>
                    <p className="text-[11px] text-slate-400 font-medium">Fill in details and launch</p>
                </div>

                <button form="wf" type="submit" disabled={isPending}
                    className="flex items-center gap-2 h-9 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-sm font-bold transition-all">
                    <Zap className="w-3.5 h-3.5" />
                    {isPending ? "Launching…" : "Launch Workshop"}
                </button>
            </nav>

            {/* ── MAIN BODY ── */}
            <form id="wf" onSubmit={handleSubmit(onSubmit)} className="flex-1 flex overflow-hidden">

                {/* ══ LEFT — Details + Logistics ══ */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-xl mx-auto px-8 py-7 space-y-8">

                        {/* ─ Section A: Workshop Details ─ */}
                        <section className="space-y-4">
                            <SectionHeader
                                icon={<BookOpen className="w-3.5 h-3.5 text-indigo-600" />}
                                label="Workshop Details"
                                sub="Basic information about your workshop"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Title" required>
                                    <input {...register("title", { required: true })}
                                        placeholder="e.g. System Design Masterclass"
                                        className="w-inp" />
                                </Field>
                                <Field label="Anchor Course" required>
                                    <Select onValueChange={v => setValue("courseId", v)} required>
                                        <SelectTrigger className="w-inp h-10 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium text-slate-700 bg-white">
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border border-slate-100 shadow-lg">
                                            {courses.map(c => (
                                                <SelectItem key={c.courseId} value={c.courseId} className="rounded-lg text-sm font-medium py-2">{c.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            <Field label="Topic / Focus Area" required>
                                <input {...register("topic", { required: true })}
                                    placeholder="e.g. Scalability, Sharding, Load Balancing"
                                    className="w-inp" />
                            </Field>
                            <Field label="Short Description" required>
                                <textarea {...register("description", { required: true })} rows={2}
                                    placeholder="What will learners gain from this session?"
                                    className="w-inp resize-none py-2.5" style={{ height: "auto" }} />
                            </Field>
                        </section>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Logistics</span>
                            <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        {/* ─ Section B: Logistics ─ */}
                        <section className="space-y-4">
                            <SectionHeader
                                icon={<Settings2 className="w-3.5 h-3.5 text-emerald-600" />}
                                label="Session Details"
                                sub="When, where, and how many?"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Google Meet Link" required>
                                    <label className="relative block cursor-text">
                                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
                                        <input {...register("googleMeetLink", { required: true })}
                                            placeholder="https://meet.google.com/…"
                                            className="w-inp"
                                            style={{ paddingLeft: '2.25rem' }} />
                                    </label>
                                </Field>
                                <Field label="Date & Time" required>
                                    <DateTimeField registerProps={register("scheduledAt", { required: true })} />
                                </Field>
                            </div>
                            <div className="max-w-[200px]">
                                <Field label="Max Seats" hint="optional">
                                    {/* Custom stepper — no ugly browser spinners */}
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
                                        <input type="number"
                                            {...register("maxSeats")}
                                            placeholder="e.g. 50"
                                            className="w-inp no-spin"
                                            style={{ paddingLeft: '2.25rem' }} />
                                    </div>
                                </Field>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Vertical divider */}
                <div className="w-px bg-slate-100 shrink-0" />

                {/* ══ RIGHT — Registration Questions ══ */}
                <div className="w-[360px] shrink-0 bg-slate-50 flex flex-col">
                    {/* Panel header */}
                    <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800">Registration Questions</p>
                                <p className="text-[11px] text-slate-400 font-medium">Applicants fill these out</p>
                            </div>
                        </div>
                        <button type="button" onClick={addQ}
                            className="flex items-center gap-1 h-7 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors">
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    </div>

                    {/* Questions list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                        {questions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                    <HelpCircle className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-600">No questions yet</p>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        At least one question is required. These help you screen applicants.
                                    </p>
                                </div>
                                <button type="button" onClick={addQ}
                                    className="flex items-center gap-1.5 h-8 px-4 rounded-lg border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 text-xs font-bold transition-all">
                                    <Plus className="w-3.5 h-3.5" /> Add First Question
                                </button>
                            </div>
                        ) : (
                            <>
                                {questions.map((q, idx) => (
                                    <div key={q.id}
                                        className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 group hover:border-indigo-200 hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">
                                                {q.number}
                                            </span>
                                            <input
                                                value={q.text}
                                                onChange={e => updateQ(q.id, "text", e.target.value)}
                                                placeholder={`Question ${idx + 1}…`}
                                                className="flex-1 h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                                            />
                                            <button type="button" onClick={() => removeQ(q.id)}
                                                className="w-7 h-7 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 pl-8">
                                            <Select value={q.type} onValueChange={(val: any) => updateQ(q.id, "type", val)}>
                                                <SelectTrigger className="w-32 h-7 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 px-2.5 focus:ring-0 focus:ring-offset-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border border-slate-100 shadow-lg">
                                                    <SelectItem value="text" className="rounded-lg text-sm font-medium py-2">Short Answer</SelectItem>
                                                    <SelectItem value="mcq" className="rounded-lg text-sm font-medium py-2">Multiple Choice</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {q.type === "mcq" && (
                                                <input placeholder="Yes, No, Maybe…"
                                                    className="flex-1 h-7 px-2.5 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 placeholder:text-slate-300 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                                                    onChange={e => updateQ(q.id, "options", e.target.value.split(",").map(s => s.trim()))}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addQ}
                                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> Add another question
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </form>

            <style>{`
                .w-inp {
                    display: block;
                    width: 100%;
                    height: 2.5rem;
                    padding: 0 0.75rem;
                    border-radius: 0.5rem;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: #1e293b;
                    outline: none;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }
                .w-inp::placeholder { color: #94a3b8; font-weight: 400; }
                .w-inp:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
                .w-inp::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
                .no-spin::-webkit-inner-spin-button, .no-spin::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                .no-spin { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
}

function SectionHeader({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm font-black text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
            </div>
        </div>
    );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {label}
                {required && <span className="text-indigo-500 text-[9px]">*</span>}
                {hint && <span className="ml-0.5 normal-case font-medium text-slate-300">({hint})</span>}
            </label>
            {children}
        </div>
    );
}

function DateTimeField({ registerProps }: { registerProps: any }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { ref: hookRef, ...rest } = registerProps;

    const openPicker = () => {
        if (inputRef.current) {
            inputRef.current.focus();
            try { (inputRef.current as any).showPicker?.(); } catch { /* unsupported browser */ }
        }
    };

    return (
        <div className="relative cursor-pointer" onClick={openPicker}>
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
            <input
                type="datetime-local"
                {...rest}
                ref={(e) => { hookRef(e); (inputRef as any).current = e; }}
                className="w-inp cursor-pointer"
                style={{ paddingLeft: '2.25rem' }}
            />
        </div>
    );
}
