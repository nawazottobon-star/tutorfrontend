import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { readStoredSession } from "@/utils/session";
import { API_BASE_URL } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    ChevronLeft, Calendar, Video, Users, ExternalLink, ClipboardList,
    Mail, Info, X, Check, Loader2, Pencil, Save, Plus, Trash2,
    AlertTriangle, Clock, CheckCircle2, XCircle, Zap,
} from "lucide-react";

interface Registration {
    registrationId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    collegeName: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    answersJson: any;
}

export default function WorkshopDetailPage() {
    const [, params] = useRoute("/tutors/workshops/:id");
    const id = params?.id;
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const qc = useQueryClient();
    const session = readStoredSession();

    const headers = useMemo(() => {
        if (!session?.accessToken) return undefined;
        return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
    }, [session?.accessToken]);

    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<"submissions" | "questions">("submissions");

    /* ── queries ─────────────────────────────────────── */
    const { data: workshopData, isLoading: wLoading } = useQuery({
        queryKey: ["workshop", id],
        queryFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/workshops/${id}`, { headers });
            if (!r.ok) throw new Error("failed");
            return r.json();
        },
        enabled: !!id,
    });

    const workshop = workshopData?.workshop;
    const sessions: any[] = workshop?.offering?.workshopSessions ?? [];
    const activeSessionId = selectedSessionId ?? sessions[0]?.sessionId ?? null;

    const { data: regsData, isLoading: rLoading } = useQuery({
        queryKey: ["regs", id, activeSessionId],
        queryFn: async () => {
            const url = activeSessionId
                ? `${API_BASE_URL}/api/workshops/${id}/registrations?sessionId=${activeSessionId}`
                : `${API_BASE_URL}/api/workshops/${id}/registrations`;
            const r = await fetch(url, { headers });
            if (!r.ok) throw new Error("failed");
            return r.json();
        },
        enabled: !!id,
    });

    const registrations: Registration[] = regsData?.registrations ?? [];
    const pending = registrations.filter((r) => r.status === "pending");
    const approved = registrations.filter((r) => r.status === "approved");
    const rejected = registrations.filter((r) => r.status === "rejected");

    /* ── status mutation ─────────────────────────────── */
    const statusM = useMutation({
        mutationFn: async ({ regId, status }: { regId: string; status: string }) => {
            const r = await fetch(`${API_BASE_URL}/api/workshops/${id}/registrations/${regId}`, {
                method: "PATCH", headers, body: JSON.stringify({ status }),
            });
            if (!r.ok) throw new Error("failed");
            return r.json();
        },
        onSuccess: (_, v) => {
            qc.invalidateQueries({ queryKey: ["regs", id] });
            toast({ title: v.status === "approved" ? "✅ Approved — email sent!" : "❌ Application rejected" });
        },
    });

    /* ── edit state ────────────────────────────────── */
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({ googleMeetLink: "", maxSeats: "", scheduledAt: "" });
    const [editQuestions, setEditQuestions] = useState<any[]>([]);

    const openEdit = () => {
        if (!workshop) return;
        const cur = sessions[0];
        setEditForm({
            googleMeetLink: workshop.googleMeetLink ?? "",
            maxSeats: workshop.maxSeats ? String(workshop.maxSeats) : "",
            scheduledAt: cur ? new Date(cur.scheduledAt).toISOString().slice(0, 16) : "",
        });
        setEditQuestions(
            (workshop.offering.questions ?? []).map((q: any) => ({
                id: q.questionId, number: q.questionNumber, text: q.questionText,
                type: q.questionType, options: q.mcqOptions ? q.mcqOptions.join(", ") : "",
            }))
        );
        setShowEdit(true);
    };

    const updateDetailsM = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/workshops/${id}`, {
                method: "PATCH", headers,
                body: JSON.stringify({ googleMeetLink: editForm.googleMeetLink || undefined, maxSeats: editForm.maxSeats || undefined, scheduledAt: editForm.scheduledAt || undefined }),
            });
            if (!r.ok) throw new Error("failed");
            return r.json();
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["workshop", id] }); toast({ title: "✅ Details saved!" }); },
    });

    const updateQsM = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/workshops/${id}/questions`, {
                method: "POST", headers,
                body: JSON.stringify({
                    questions: editQuestions.map((q) => ({
                        number: q.number, text: q.text, type: q.type,
                        options: q.type === "mcq" ? q.options.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
                    })),
                }),
            });
            if (!r.ok) throw new Error("failed");
            return r.json();
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["workshop", id] }); toast({ title: "✅ Questions saved!" }); },
    });

    const addEQ = () => setEditQuestions((p) => [...p, { id: Date.now(), number: p.length + 1, text: "", type: "text", options: "" }]);
    const removeEQ = (eid: any) => setEditQuestions((p) => p.filter((q) => q.id !== eid).map((q, i) => ({ ...q, number: i + 1 })));
    const updateEQ = (eid: any, f: string, v: string) => setEditQuestions((p) => p.map((q) => (q.id === eid ? { ...q, [f]: v } : q)));

    /* ── schedule new run ────────────────────────────── */
    const [showSchedule, setShowSchedule] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [newRunForm, setNewRunForm] = useState({ googleMeetLink: "", maxSeats: "" });
    const [newQs, setNewQs] = useState<any[]>([]);

    const latestSession = sessions[0];
    const isActive = latestSession && new Date(latestSession.scheduledAt) > new Date();

    const openSchedule = () => {
        if (!workshop) return;
        setNewDate("");
        setNewRunForm({ googleMeetLink: workshop.googleMeetLink ?? "", maxSeats: workshop.maxSeats ? String(workshop.maxSeats) : "" });
        setNewQs((workshop.offering.questions ?? []).map((q: any) => ({
            id: q.questionId, number: q.questionNumber, text: q.questionText, type: q.questionType,
            options: q.mcqOptions ? q.mcqOptions.join(", ") : "",
        })));
        setShowSchedule(true);
    };

    const scheduleM = useMutation({
        mutationFn: async () => {
            const r = await fetch(`${API_BASE_URL}/api/workshops/${id}/sessions`, {
                method: "POST", headers,
                body: JSON.stringify({
                    scheduledAt: newDate, googleMeetLink: newRunForm.googleMeetLink || undefined,
                    maxSeats: newRunForm.maxSeats || undefined,
                    questions: newQs.map((q) => ({
                        number: q.number, text: q.text, type: q.type,
                        options: q.type === "mcq" ? q.options.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
                    })),
                }),
            });
            if (!r.ok) throw new Error("failed");
            return r.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["workshop", id] });
            setShowSchedule(false);
            toast({ title: "🚀 New run scheduled!" });
        },
        onError: () => toast({ title: "❌ Error scheduling run" }),
    });

    const addNQ = () => setNewQs((p) => [...p, { id: Date.now(), number: p.length + 1, text: "", type: "text", options: "" }]);
    const removeNQ = (nid: any) => setNewQs((p) => p.filter((q) => q.id !== nid).map((q, i) => ({ ...q, number: i + 1 })));
    const updateNQ = (nid: any, f: string, v: string) => setNewQs((p) => p.map((q) => (q.id === nid ? { ...q, [f]: v } : q)));

    /* ── loading ─────────────────────────────────────── */
    if (wLoading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-2xl bg-indigo-200 animate-ping opacity-60" />
                    <div className="relative w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                </div>
                <p className="text-sm font-semibold text-slate-400 animate-pulse">Loading…</p>
            </div>
        </div>
    );

    const currentSession = sessions.find((s: any) => s.sessionId === activeSessionId) ?? sessions[0];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ══════════════════════════════════════════════
                HERO HEADER — full-width, crystal clear
            ══════════════════════════════════════════════ */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6">
                    {/* Breadcrumb */}
                    <div className="pt-4 pb-2">
                        <button onClick={() => setLocation("/tutors")}
                            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors group w-fit">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Workshop title row */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 pt-2">
                        <div>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 ${workshop?.offering.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${workshop?.offering.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                                {workshop?.offering.isActive ? "Live" : "Draft"}
                            </span>
                            <h1 className="text-2xl font-black text-slate-900 leading-tight">{workshop?.offering.title}</h1>
                            {workshop?.offering.description && (
                                <p className="text-slate-500 text-sm mt-1 max-w-xl">{workshop.offering.description}</p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    if (isActive) { toast({ title: "Session is still upcoming", description: "You can schedule a new run only after the current session passes." }); return; }
                                    openSchedule();
                                }}
                                disabled={!!isActive}
                                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Schedule New Run
                            </button>
                            <button onClick={openEdit}
                                className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all">
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => window.open(workshop?.googleMeetLink)}
                                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold transition-all shadow-sm">
                                <ExternalLink className="w-3.5 h-3.5" /> Join Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

                {/* ══════════════════════════════════════════════
                    INFO STRIP — 3 key facts in one scannable row
                ══════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-indigo-600" /></div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Session</p>
                            <p className="text-sm font-bold text-slate-800 truncate">
                                {currentSession
                                    ? new Date(currentSession.scheduledAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                    : "—"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><Video className="w-4 h-4 text-emerald-600" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meet Link</p>
                            <a href={workshop?.googleMeetLink} target="_blank" rel="noreferrer"
                                className="text-sm font-bold text-indigo-600 hover:underline truncate block">{workshop?.googleMeetLink || "Not set"}</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-amber-600" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capacity</p>
                            <p className="text-sm font-bold text-slate-800">{workshop?.maxSeats ? `${workshop.maxSeats} seats` : "Unlimited"}</p>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════
                    STAT CHIPS — at a glance application counts
                ══════════════════════════════════════════════ */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold">
                        <Clock className="w-3.5 h-3.5" /> {pending.length} Pending
                    </span>
                    <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {approved.length} Approved
                    </span>
                    <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
                        <XCircle className="w-3.5 h-3.5" /> {rejected.length} Rejected
                    </span>

                    {/* session run pills — right side */}
                    {sessions.length > 1 && (
                        <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 mr-1">Viewing run:</span>
                            {sessions.map((s: any, i: number) => (
                                <button key={s.sessionId}
                                    onClick={() => setSelectedSessionId(s.sessionId)}
                                    className={`h-7 px-3 rounded-full text-xs font-black transition-all ${activeSessionId === s.sessionId ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                    Run {s.sessionNo}{i === 0 ? " ★" : ""}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════
                    SECTION SWITCHER (Submissions / Questions)
                ══════════════════════════════════════════════ */}
                <div className="flex items-center gap-1 border-b border-slate-100">
                    {(["submissions", "questions"] as const).map((tab) => (
                        <button key={tab} onClick={() => setActiveSection(tab)}
                            className={`relative pb-3 px-5 text-sm font-bold transition-all ${activeSection === tab ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"}`}>
                            {tab === "submissions" ? "Learner Applications" : "Form Questions"}
                            {activeSection === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                            {tab === "submissions" && pending.length > 0 && activeSection !== "submissions" && (
                                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-black">{pending.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════
                    PENDING ALERT BANNER (only when there are pending)
                ══════════════════════════════════════════════ */}
                {activeSection === "submissions" && pending.length > 0 && (
                    <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-sm font-semibold text-amber-800">
                            <span className="font-black">{pending.length} application{pending.length > 1 ? "s" : ""} waiting for your review.</span> {" "}
                            Hover a row below to approve or reject.
                        </p>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    MAIN CONTENT PANEL
                ══════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                    {/* SUBMISSIONS */}
                    {activeSection === "submissions" && (
                        <>
                            {rLoading ? (
                                <div className="py-24 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-indigo-200" /></div>
                            ) : registrations.length === 0 ? (
                                <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        <Mail className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-700 text-lg">No applications yet</p>
                                        <p className="text-slate-400 text-sm mt-1">When learners sign up, their applications appear here.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            <th className="text-left text-[11px] font-black uppercase tracking-widest text-slate-400 px-6 py-3.5">Learner</th>
                                            <th className="text-left text-[11px] font-black uppercase tracking-widest text-slate-400 py-3.5">College</th>
                                            <th className="text-center text-[11px] font-black uppercase tracking-widest text-slate-400 py-3.5">Status</th>
                                            <th className="text-right text-[11px] font-black uppercase tracking-widest text-slate-400 px-6 py-3.5">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map((reg) => (
                                            <tr key={reg.registrationId}
                                                className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group cursor-default">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {/* Avatar with initial */}
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                                                            {reg.fullName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{reg.fullName}</p>
                                                            <p className="text-xs text-slate-400">{reg.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-sm text-slate-600 font-medium">{reg.collegeName}</p>
                                                    {/* View Answers button */}
                                                    <button
                                                        className="mt-1 flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                                                        onClick={() => {
                                                            const answers: any[] = reg.answersJson ?? [];
                                                            const questions: any[] = workshop?.offering.questions ?? [];
                                                            toast({
                                                                title: `${reg.fullName}'s Application`,
                                                                description: (
                                                                    <div className="space-y-4 mt-2 max-h-[55vh] overflow-y-auto pr-1">
                                                                        {answers.map((ans: any, i: number) => {
                                                                            const q = questions.find((q: any) => q.questionNumber === ans.questionNumber);
                                                                            const isText = !q || q.questionType === "text";
                                                                            const opts: string[] = q?.mcqOptions ?? [];
                                                                            return (
                                                                                <div key={i} className="space-y-1.5">
                                                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Q{ans.questionNumber}</p>
                                                                                    <p className="text-sm font-bold text-slate-700">{ans.questionText}</p>
                                                                                    {isText ? (
                                                                                        <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">{ans.answer}</div>
                                                                                    ) : (
                                                                                        <div className="flex flex-wrap gap-1.5">
                                                                                            {opts.map((opt, j) => (
                                                                                                <span key={j} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${opt === ans.answer ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-slate-400 border-slate-200"}`}>{opt}</span>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ),
                                                            });
                                                        }}
                                                    >
                                                        <Info className="w-3 h-3" /> View answers
                                                    </button>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${reg.status === "approved" ? "bg-emerald-100 text-emerald-700" : reg.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                                                        {reg.status === "approved" ? <CheckCircle2 className="w-3 h-3" /> : reg.status === "rejected" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                        {reg.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                        {reg.status === "pending" ? (
                                                            <>
                                                                <button
                                                                    title="Reject"
                                                                    onClick={() => statusM.mutate({ regId: reg.registrationId, status: "rejected" })}
                                                                    disabled={statusM.isPending}
                                                                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold transition-colors">
                                                                    <X className="w-3.5 h-3.5" /> Reject
                                                                </button>
                                                                <button
                                                                    title="Approve"
                                                                    onClick={() => statusM.mutate({ regId: reg.registrationId, status: "approved" })}
                                                                    disabled={statusM.isPending}
                                                                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors">
                                                                    <Check className="w-3.5 h-3.5" /> Approve
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 font-bold">Done</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {/* QUESTIONS */}
                    {activeSection === "questions" && (
                        <div className="p-6">
                            {(workshop?.offering.questions ?? []).length === 0 ? (
                                <div className="py-20 flex flex-col items-center gap-3 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        <ClipboardList className="w-7 h-7 text-slate-200" />
                                    </div>
                                    <p className="font-black text-slate-600">No questions yet</p>
                                    <p className="text-slate-400 text-sm">Click <strong>Edit</strong> at the top to add application questions.</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-3">
                                    {workshop?.offering.questions.map((q: any) => (
                                        <div key={q.questionId} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">{q.questionNumber}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{q.questionType === "mcq" ? "Multiple Choice" : "Short Answer"}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q.questionText}</p>
                                            {q.questionType === "mcq" && Array.isArray(q.mcqOptions) && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {q.mcqOptions.map((opt: string, i: number) => (
                                                        <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500">{opt}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                SCHEDULE NEW RUN DIALOG
            ══════════════════════════════════════════════ */}
            <Dialog open={showSchedule} onOpenChange={(o) => !o && setShowSchedule(false)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-indigo-600" /></div>
                            <div>
                                <DialogTitle className="font-black text-slate-800">Schedule New Run</DialogTitle>
                                <p className="text-xs text-slate-400 mt-0.5">Previous sessions & their registrations are safe.</p>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 pt-1">
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Date & Time *</label>
                            <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Google Meet Link</label>
                            <input type="url" value={newRunForm.googleMeetLink} onChange={(e) => setNewRunForm({ ...newRunForm, googleMeetLink: e.target.value })}
                                placeholder="https://meet.google.com/..."
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Max Seats <span className="normal-case font-medium text-slate-300">(optional)</span></label>
                            <input type="number" value={newRunForm.maxSeats} onChange={(e) => setNewRunForm({ ...newRunForm, maxSeats: e.target.value })}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Questions</p>
                                <button onClick={addNQ} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" />Add</button>
                            </div>
                            <div className="space-y-2 max-h-36 overflow-y-auto">
                                {newQs.map((q, idx) => (
                                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 group relative">
                                        <button onClick={() => removeNQ(q.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                                        <input value={q.text} onChange={(e) => updateNQ(q.id, "text", e.target.value)} placeholder={`Question ${idx + 1}`}
                                            className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300 pr-6" />
                                        <div className="flex gap-2">
                                            <select value={q.type} onChange={(e) => updateNQ(q.id, "type", e.target.value)} className="bg-white border border-slate-200 text-xs rounded-md px-2 py-1 outline-none font-semibold text-slate-600">
                                                <option value="text">Short Answer</option>
                                                <option value="mcq">Multiple Choice</option>
                                            </select>
                                            {q.type === "mcq" && (
                                                <input value={q.options} onChange={(e) => updateNQ(q.id, "options", e.target.value)} placeholder="opt1, opt2…"
                                                    className="flex-1 text-xs bg-white border border-slate-200 rounded-md px-2 py-1 outline-none font-medium text-slate-600" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowSchedule(false)} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={() => scheduleM.mutate()} disabled={!newDate || scheduleM.isPending}
                                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold transition-colors">
                                {scheduleM.isPending ? "Scheduling…" : "🚀 Schedule"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════════════
                EDIT WORKSHOP DIALOG
            ══════════════════════════════════════════════ */}
            <Dialog open={showEdit} onOpenChange={(o) => !o && setShowEdit(false)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center"><Pencil className="w-4 h-4 text-indigo-600" /></div>
                            <div>
                                <DialogTitle className="font-black text-slate-800">Edit Workshop</DialogTitle>
                                <p className="text-xs text-slate-400 mt-0.5">Date/link changes auto-email approved learners.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-5 pt-1">
                        {/* Session details section */}
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Session Details</p>
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-medium text-amber-700">Changing date or Meet link automatically emails all approved learners.</p>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: "Date & Time", type: "datetime-local", value: editForm.scheduledAt, onChange: (v: string) => setEditForm((f) => ({ ...f, scheduledAt: v })) },
                                    { label: "Google Meet Link", type: "text", value: editForm.googleMeetLink, onChange: (v: string) => setEditForm((f) => ({ ...f, googleMeetLink: v })), placeholder: "https://meet.google.com/..." },
                                    { label: "Max Seats", type: "number", value: editForm.maxSeats, onChange: (v: string) => setEditForm((f) => ({ ...f, maxSeats: v })), placeholder: "Leave blank for unlimited" },
                                ].map(({ label, type, value, onChange, placeholder }) => (
                                    <div key={label}>
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</label>
                                        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" />
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => updateDetailsM.mutate()} disabled={updateDetailsM.isPending}
                                className="mt-3 w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                <Save className="w-4 h-4" /> {updateDetailsM.isPending ? "Saving…" : "Save Details"}
                            </button>
                        </div>

                        <div className="border-t border-slate-100" />

                        {/* Questions section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Application Questions</p>
                                <button onClick={addEQ} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" />Add</button>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-3">Changes only affect future applications.</p>
                            <div className="space-y-2">
                                {editQuestions.map((q) => (
                                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">{q.number}</span>
                                            <input value={q.text} onChange={(e) => updateEQ(q.id, "text", e.target.value)} placeholder="Question text…"
                                                className="flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300" />
                                            <button onClick={() => removeEQ(q.id)} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex gap-2 pl-7">
                                            <select value={q.type} onChange={(e) => updateEQ(q.id, "type", e.target.value)} className="bg-white border border-slate-200 text-xs rounded-md px-2 py-1 outline-none font-semibold text-slate-600">
                                                <option value="text">Short Answer</option>
                                                <option value="mcq">Multiple Choice</option>
                                            </select>
                                            {q.type === "mcq" && (
                                                <input value={q.options} onChange={(e) => updateEQ(q.id, "options", e.target.value)} placeholder="Options (comma separated)"
                                                    className="flex-1 bg-white border border-slate-200 rounded-md text-xs px-2 py-1 font-medium text-slate-700 outline-none" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => updateQsM.mutate()} disabled={updateQsM.isPending}
                                className="mt-3 w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                <Save className="w-4 h-4" /> {updateQsM.isPending ? "Saving…" : "Save Questions"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
