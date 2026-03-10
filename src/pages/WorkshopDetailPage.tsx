import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { readStoredSession } from "@/utils/session";
import { API_BASE_URL } from "@/lib/api";
import {
    ChevronLeft,
    Calendar,
    Video,
    Users,
    ExternalLink,
    ClipboardList,
    Mail,
    Info,
    X,
    Check,
    Loader2,
    Pencil,
    Save,
    Plus,
    Trash2,
    AlertTriangle
} from "lucide-react";
import "@/workshops.css";

interface Registration {
    registrationId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    collegeName: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    answersJson: any;
}

export default function WorkshopDetailPage() {
    const [, params] = useRoute("/tutors/workshops/:id");
    const id = params?.id;
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const session = readStoredSession();

    const headers = useMemo(() => {
        if (!session?.accessToken) return undefined;
        return { 'Authorization': `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' };
    }, [session?.accessToken]);

    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const { data: workshopData, isLoading: workshopLoading } = useQuery({
        queryKey: ['workshop', id],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/workshops/${id}`, { headers });
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        enabled: !!id
    });

    const activeSessionId = selectedSessionId || workshopData?.workshop?.offering?.workshopSessions?.[0]?.sessionId;

    const { data: regsData, isLoading: regsLoading } = useQuery({
        queryKey: ['workshop-registrations', id, activeSessionId],
        queryFn: async () => {
            const url = activeSessionId
                ? `${API_BASE_URL}/api/workshops/${id}/registrations?sessionId=${activeSessionId}`
                : `${API_BASE_URL}/api/workshops/${id}/registrations`;
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        enabled: !!id
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ regId, status }: { regId: string, status: string }) => {
            const res = await fetch(`${API_BASE_URL}/api/workshops/${id}/registrations/${regId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['workshop-registrations', id] });
            if (variables.status === 'approved') {
                toast({ title: "✅ Seat Confirmed", description: "Email with the Meet link has been sent to the learner." });
            } else {
                toast({ title: "❌ Application Rejected", description: "The application has been rejected. No email was sent." });
            }
        }
    });

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ googleMeetLink: '', maxSeats: '', scheduledAt: '' });
    const [editQuestions, setEditQuestions] = useState<any[]>([]);
    const [newRunDate, setNewRunDate] = useState('');
    const [showNewRun, setShowNewRun] = useState(false);
    const [newRunForm, setNewRunForm] = useState({ googleMeetLink: '', maxSeats: '' });
    const [newRunQuestions, setNewRunQuestions] = useState<any[]>([]);

    const scheduleRunM = useMutation({
        mutationFn: async () => {
            const payloadQuestions = newRunQuestions.map(q => ({
                number: q.number,
                text: q.text,
                type: q.type,
                options: q.type === 'mcq' ? q.options.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined
            }));

            const res = await fetch(`${API_BASE_URL}/api/workshops/${id}/sessions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    scheduledAt: newRunDate,
                    googleMeetLink: newRunForm.googleMeetLink || undefined,
                    maxSeats: newRunForm.maxSeats || undefined,
                    questions: payloadQuestions
                })
            });
            if (!res.ok) throw new Error('Failed to schedule new run');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workshop', id] });
            setShowNewRun(false);
            setNewRunDate('');
            toast({ title: '🚀 New Session Scheduled!', description: 'Session added. New learner registrations will be tracked separately for this run.' });
        },
        onError: () => toast({ title: '❌ Error', description: 'Failed to schedule new run.' })
    });

    const openEditMode = () => {
        if (!workshop) return;
        const currentSession = workshop.offering.workshopSessions[0];
        const scheduledAt = currentSession
            ? new Date(currentSession.scheduledAt).toISOString().slice(0, 16)
            : '';
        setEditForm({
            googleMeetLink: workshop.googleMeetLink,
            maxSeats: workshop.maxSeats ? String(workshop.maxSeats) : '',
            scheduledAt
        });
        setEditQuestions(
            (workshop.offering.questions ?? []).map((q: any, i: number) => ({
                id: q.questionId,
                number: q.questionNumber,
                text: q.questionText,
                type: q.questionType,
                options: q.mcqOptions ? q.mcqOptions.join(', ') : ''
            }))
        );
        setEditMode(true);
    };

    const updateDetailsM = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/workshops/${id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    googleMeetLink: editForm.googleMeetLink || undefined,
                    maxSeats: editForm.maxSeats || undefined,
                    scheduledAt: editForm.scheduledAt || undefined,
                })
            });
            if (!res.ok) throw new Error('Failed to update workshop');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workshop', id] });
            toast({ title: '✅ Details Saved', description: 'Workshop updated. Approved learners have been notified if date/link changed.' });
        },
        onError: () => toast({ title: '❌ Error', description: 'Failed to save workshop details.' })
    });

    const updateQuestionsM = useMutation({
        mutationFn: async () => {
            const payload = editQuestions.map(q => ({
                number: q.number,
                text: q.text,
                type: q.type,
                options: q.type === 'mcq' ? q.options.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined
            }));
            const res = await fetch(`${API_BASE_URL}/api/workshops/${id}/questions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ questions: payload })
            });
            if (!res.ok) throw new Error('Failed to save questions');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workshop', id] });
            toast({ title: '✅ Questions Saved', description: 'Questions updated. Only future applications will see the new questions.' });
        },
        onError: () => toast({ title: '❌ Error', description: 'Failed to save questions.' })
    });

    const addEditQuestion = () => {
        setEditQuestions(prev => [...prev, { id: Date.now(), number: prev.length + 1, text: '', type: 'text', options: '' }]);
    };

    const removeEditQuestion = (id: number | string) => {
        setEditQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, number: i + 1 })));
    };

    const updateEditQuestion = (id: number | string, field: string, value: string) => {
        setEditQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const addNewRunQuestion = () => {
        setNewRunQuestions(prev => [...prev, { id: Date.now(), number: prev.length + 1, text: '', type: 'text', options: '' }]);
    };

    const removeNewRunQuestion = (id: number | string) => {
        setNewRunQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, number: i + 1 })));
    };

    const updateNewRunQuestion = (id: number | string, field: string, value: string) => {
        setNewRunQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const workshop = workshopData?.workshop;
    const registrations = regsData?.registrations ?? [];

    const latestSession = workshop?.offering?.workshopSessions?.[0];
    const isLatestSessionActive = latestSession && new Date(latestSession.scheduledAt) > new Date();

    if (workshopLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E1E8EE] via-[#F0F4F7] to-[#F8FAFC] pb-20 font-sans">
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => setLocation('/tutors')}
                        className="hover:bg-white/50 rounded-2xl transition-all duration-300 text-slate-500 font-bold"
                    >
                        <ChevronLeft className="mr-2 h-5 w-5" /> Back to Dashboard
                    </Button>
                    <div className="flex items-center gap-4 bg-white/40 p-1 rounded-[2.5rem] shadow-sm backdrop-blur-sm border border-white/60">
                        {!editMode && (
                            <Button
                                onClick={() => {
                                    if (isLatestSessionActive) {
                                        toast({ title: "Wait!", description: "You cannot schedule a new run until the current session has completed." });
                                        return;
                                    }
                                    if (!showNewRun && workshop) {
                                        // Initialize form with current values
                                        setNewRunForm({
                                            googleMeetLink: workshop.googleMeetLink || '',
                                            maxSeats: workshop.maxSeats ? String(workshop.maxSeats) : ''
                                        });
                                        setNewRunQuestions(
                                            (workshop.offering.questions ?? []).map((q: any, i: number) => ({
                                                id: q.questionId,
                                                number: q.questionNumber,
                                                text: q.questionText,
                                                type: q.questionType,
                                                options: q.mcqOptions ? q.mcqOptions.join(', ') : ''
                                            }))
                                        );
                                    }
                                    setShowNewRun(!showNewRun);
                                }}
                                disabled={isLatestSessionActive}
                                className={`h-11 px-6 font-black rounded-[2rem] shadow-sm transition-all transform active:scale-95 ${showNewRun ? 'bg-slate-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-50'
                                    }`}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {isLatestSessionActive ? 'Current Run Active' : (showNewRun ? 'Close Scheduler' : 'Schedule New Run')}
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                console.log("EDIT_WORKSHOP_CLICK", { current: editMode });
                                if (editMode) {
                                    setEditMode(false);
                                    toast({ title: "Edit Mode Cancelled", description: "Your changes were not saved." });
                                } else {
                                    openEditMode();
                                }
                                setShowNewRun(false);
                            }}
                            className={`h-11 px-6 font-black rounded-[2rem] shadow-sm transition-all transform active:scale-95 ${editMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'clay-btn-blue'
                                }`}
                        >
                            {editMode ? <><X className="w-4 h-4 mr-2" /> Cancel Edit</> : <><Pencil className="w-4 h-4 mr-2" /> Edit Workshop</>}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-10 lg:grid-cols-12">
                    {/* Left: Summary */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Schedule New Run Panel (Moved to top for visibility) */}
                        {showNewRun && !editMode && (
                            <div className="clay-card p-8 bg-emerald-500 text-white border-none space-y-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-white">Schedule New Run</h2>
                                </div>
                                <p className="text-xs font-bold text-emerald-50 leading-relaxed">
                                    Creating a fresh session allows new learners to register. Past sessions and their registrations are preserved.
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Date & Time for New Run</label>
                                        <input
                                            type="datetime-local"
                                            value={newRunDate}
                                            onChange={e => setNewRunDate(e.target.value)}
                                            className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black focus:bg-white/20 outline-none placeholder:text-emerald-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Google Meet Link</label>
                                        <input
                                            type="url"
                                            value={newRunForm.googleMeetLink}
                                            onChange={e => setNewRunForm({ ...newRunForm, googleMeetLink: e.target.value })}
                                            className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black focus:bg-white/20 outline-none placeholder:text-emerald-200"
                                            placeholder="https://meet.google.com/..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Max Seats (Optional)</label>
                                        <input
                                            type="number"
                                            value={newRunForm.maxSeats}
                                            onChange={e => setNewRunForm({ ...newRunForm, maxSeats: e.target.value })}
                                            className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black focus:bg-white/20 outline-none placeholder:text-emerald-200"
                                        />
                                    </div>

                                    {/* Questions section inline */}
                                    <div className="pt-4 border-t border-white/20 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-black text-white">Application Questions</label>
                                            <Button size="sm" onClick={addNewRunQuestion} className="h-8 bg-white/20 hover:bg-white/30 text-white rounded-xl">
                                                <Plus className="w-3 h-3 mr-1" /> Add
                                            </Button>
                                        </div>
                                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {newRunQuestions.map((q, idx) => (
                                                <div key={q.id} className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-2 relative group">
                                                    <button onClick={() => removeNewRunQuestion(q.id)} className="absolute top-2 right-2 text-white/50 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={q.text}
                                                        onChange={e => updateNewRunQuestion(q.id, 'text', e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/20 text-white text-sm font-bold pb-1 outline-none placeholder:text-white/40"
                                                        placeholder={`Question ${idx + 1}`}
                                                    />
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={q.type}
                                                            onChange={e => updateNewRunQuestion(q.id, 'type', e.target.value)}
                                                            className="bg-white/20 text-white text-xs rounded-lg px-2 py-1 outline-none appearance-none font-bold"
                                                        >
                                                            <option value="text" className="text-slate-800">Text</option>
                                                            <option value="mcq" className="text-slate-800">MCQ</option>
                                                        </select>
                                                        {q.type === 'mcq' && (
                                                            <input
                                                                type="text"
                                                                value={q.options}
                                                                onChange={e => updateNewRunQuestion(q.id, 'options', e.target.value)}
                                                                className="flex-1 bg-transparent border-b border-white/20 text-white text-xs outline-none placeholder:text-white/40 font-medium"
                                                                placeholder="option1, option2..."
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setShowNewRun(false); }}
                                        className="flex-1 h-12 font-black text-white hover:bg-white/10 rounded-2xl border border-white/20"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => scheduleRunM.mutate()}
                                        disabled={!newRunDate || scheduleRunM.isPending}
                                        className="flex-1 h-12 font-black bg-white text-emerald-600 hover:bg-emerald-50 rounded-2xl shadow-xl shadow-emerald-900/20"
                                    >
                                        {scheduleRunM.isPending ? 'Processing...' : 'Schedule Run 🚀'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="clay-card p-8 bg-white">
                            <div className="space-y-6">
                                <Badge className="w-fit px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 border-none font-black uppercase text-[10px] tracking-widest shadow-sm">
                                    {workshop?.offering.isActive ? '• Live Session' : 'Draft Mode'}
                                </Badge>
                                <h1 className="text-3xl font-black text-slate-800 leading-tight">{workshop?.offering.title}</h1>

                                <div className="space-y-5 pt-4">
                                    <div className="flex items-center gap-4">
                                        <div className="clay-card p-3 text-blue-500 bg-white">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase tracking-tighter text-slate-600">Scheduled Date</span>
                                            <span className="text-md font-bold text-slate-800">
                                                {workshop?.offering.workshopSessions[0]
                                                    ? new Date(workshop.offering.workshopSessions[0].scheduledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : 'TBD'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="clay-card p-3 text-emerald-500 bg-white">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[11px] font-black uppercase tracking-tighter text-slate-600">Google Meet</span>
                                            <a href={workshop?.googleMeetLink} target="_blank" rel="noreferrer" className="text-md font-bold text-blue-600 hover:underline truncate">
                                                {workshop?.googleMeetLink}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="clay-card p-3 text-amber-500 bg-white">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase tracking-tighter text-slate-600">Total Capacity</span>
                                            <span className="text-md font-bold text-slate-800">{workshop?.maxSeats || 'Unlimited'} Seats available</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button className="clay-btn-blue w-full h-14 font-black shadow-lg" onClick={() => window.open(workshop?.googleMeetLink)}>
                                        Join Session <ExternalLink className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {editMode ? (
                            <>
                                {/* Edit Details Panel */}
                                <div className="clay-card p-8 bg-white space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Pencil className="w-5 h-5 text-blue-400" />
                                        <h2 className="text-lg font-black text-slate-700">Edit Session Details</h2>
                                    </div>
                                    <div className="flex items-start gap-2 bg-amber-50 rounded-2xl px-4 py-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-[11px] font-bold text-amber-600 leading-relaxed">Changing date or meet link will automatically send update emails to all approved learners.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">New Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={editForm.scheduledAt}
                                                onChange={e => setEditForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                                className="clay-input w-full h-12 px-4 font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Google Meet Link</label>
                                            <input
                                                value={editForm.googleMeetLink}
                                                onChange={e => setEditForm(f => ({ ...f, googleMeetLink: e.target.value }))}
                                                className="clay-input w-full h-12 px-4 font-bold text-slate-800"
                                                placeholder="https://meet.google.com/..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Max Seats</label>
                                            <input
                                                type="number"
                                                value={editForm.maxSeats}
                                                onChange={e => setEditForm(f => ({ ...f, maxSeats: e.target.value }))}
                                                className="clay-input w-full h-12 px-4 font-bold text-slate-800"
                                                placeholder="Leave blank for unlimited"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => updateDetailsM.mutate()}
                                            disabled={updateDetailsM.isPending}
                                            className="clay-btn-blue w-full h-12 font-black"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {updateDetailsM.isPending ? 'Saving...' : 'Save Details'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Edit Questions Panel */}
                                <div className="clay-card p-8 bg-white/50 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <ClipboardList className="w-5 h-5 text-slate-400" />
                                            <h2 className="text-lg font-black text-slate-700">Edit Questions</h2>
                                        </div>
                                        <Button type="button" variant="ghost" onClick={addEditQuestion} className="clay-btn-blue h-9 px-4 text-xs font-black shadow-sm">
                                            <Plus className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400">Changes apply to future applications only.</p>
                                    <div className="space-y-4">
                                        {editQuestions.map((q) => (
                                            <div key={q.id} className="clay-card p-5 bg-white space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="clay-card w-8 h-8 flex items-center justify-center font-black text-blue-500 bg-white text-sm shrink-0">{q.number}</span>
                                                    <input
                                                        value={q.text}
                                                        onChange={e => updateEditQuestion(q.id, 'text', e.target.value)}
                                                        placeholder="Question text..."
                                                        className="clay-input flex-1 h-10 px-4 font-bold text-slate-800 text-sm"
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEditQuestion(q.id)} className="w-9 h-9 rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex gap-3 pl-10">
                                                    <select
                                                        value={q.type}
                                                        onChange={e => updateEditQuestion(q.id, 'type', e.target.value)}
                                                        className="clay-input h-9 px-3 font-bold text-slate-500 text-sm"
                                                    >
                                                        <option value="text">Short Answer</option>
                                                        <option value="mcq">Multiple Choice</option>
                                                    </select>
                                                    {q.type === 'mcq' && (
                                                        <input
                                                            value={q.options}
                                                            onChange={e => updateEditQuestion(q.id, 'options', e.target.value)}
                                                            placeholder="Options (comma separated)"
                                                            className="clay-input flex-1 h-9 px-3 font-bold text-slate-800 text-sm"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => updateQuestionsM.mutate()}
                                        disabled={updateQuestionsM.isPending}
                                        className="clay-btn-blue w-full h-12 font-black"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {updateQuestionsM.isPending ? 'Saving...' : 'Save Questions'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="clay-card p-8 bg-white/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <ClipboardList className="w-5 h-5 text-slate-400" />
                                    <h2 className="text-lg font-black text-slate-700">Form Questions</h2>
                                </div>
                                <div className="space-y-4">
                                    {workshop?.offering.questions.map((q: any) => (
                                        <div key={q.questionId} className="p-5 clay-input bg-white/40">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Question {q.questionNumber}</p>
                                            <p className="text-sm text-slate-700 font-bold leading-relaxed">{q.questionText}</p>
                                            {q.questionType === 'mcq' && q.mcqOptions && Array.isArray(q.mcqOptions) && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {q.mcqOptions.map((opt: string, i: number) => (
                                                        <span key={i} className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500 shadow-sm">
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Submissions */}
                    <div className="lg:col-span-8">
                        <div className="clay-card p-8 bg-white min-h-[700px] flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Learner Submissions</h2>
                                    <p className="text-slate-400 font-bold">Review applications for your workshop runs.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={activeSessionId || ''}
                                        onChange={(e) => setSelectedSessionId(e.target.value)}
                                        className="h-10 px-4 rounded-xl bg-slate-50 border-none font-bold text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                        {workshop?.offering.workshopSessions?.map((session: any, idx: number) => (
                                            <option key={session.sessionId} value={session.sessionId}>
                                                Run {session.sessionNo} ({new Date(session.scheduledAt).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="clay-card px-5 py-2 bg-slate-50 font-black text-blue-500">
                                        {registrations.length} Total
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                {regsLoading ? (
                                    <div className="p-10 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-200" /></div>
                                ) : registrations.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center justify-center h-full">
                                        <div className="w-24 h-24 clay-card flex items-center justify-center text-slate-200 mb-6 bg-slate-50">
                                            <Mail className="w-12 h-12" />
                                        </div>
                                        <h3 className="font-black text-2xl text-slate-800">Quiet for now...</h3>
                                        <p className="text-slate-400 font-bold mt-2">Registers will pop up here as they sign up.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-3xl">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-none hover:bg-transparent">
                                                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-slate-300 px-6">Learner</TableHead>
                                                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-slate-300">Background</TableHead>
                                                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-slate-300 text-center">Status</TableHead>
                                                    <TableHead className="font-black text-[11px] uppercase tracking-widest text-slate-300 text-right px-6">Review</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {registrations.map((reg: Registration) => (
                                                    <TableRow key={reg.registrationId} className="border-b border-slate-50/50 hover:bg-slate-50/50 transition-all group">
                                                        <TableCell className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-800">{reg.fullName}</span>
                                                                <span className="text-xs font-bold text-slate-400">{reg.email}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-2">
                                                                <div className="text-xs font-bold text-slate-500 italic">
                                                                    {reg.collegeName}
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 px-3 w-fit text-[10px] font-black uppercase tracking-tighter bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"
                                                                    onClick={() => {
                                                                        const answers: any[] = reg.answersJson ?? [];
                                                                        const questions: any[] = workshop?.offering.questions ?? [];
                                                                        toast({
                                                                            title: `${reg.fullName}'s Application`,
                                                                            description: (
                                                                                <div className="space-y-5 mt-3 max-h-[60vh] overflow-y-auto pr-1">
                                                                                    {answers.map((ans: any, i: number) => {
                                                                                        const question = questions.find((q: any) => q.questionNumber === ans.questionNumber);
                                                                                        const isShortAnswer = !question || question.questionType === 'text';
                                                                                        const options: string[] = question?.mcqOptions ?? [];
                                                                                        return (
                                                                                            <div key={i} className="space-y-2">
                                                                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Question {ans.questionNumber}</p>
                                                                                                <p className="text-sm font-bold text-slate-700">{ans.questionText}</p>
                                                                                                {isShortAnswer ? (
                                                                                                    <div className="mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                                                        <p className="text-sm text-slate-600 font-semibold leading-relaxed">{ans.answer}</p>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                                                                        {options.map((opt: string, j: number) => (
                                                                                                            <span
                                                                                                                key={j}
                                                                                                                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all
                                                                                                                    ${opt === ans.answer
                                                                                                                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                                                                                                                        : 'bg-white text-slate-400 border-slate-100'
                                                                                                                    }`}
                                                                                                            >
                                                                                                                {opt}
                                                                                                            </span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )
                                                                        });
                                                                    }}
                                                                >
                                                                    View Intent <Info className="w-3 h-3 ml-1" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                className={`
                                                    font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-full border-none shadow-sm
                                                    ${reg.status === 'approved' ? 'bg-emerald-500 text-white' :
                                                                        reg.status === 'rejected' ? 'bg-red-400 text-white' :
                                                                            'bg-slate-200 text-slate-500'}
                                                `}
                                                            >
                                                                {reg.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right px-6">
                                                            <div className="flex items-center justify-end gap-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                                {reg.status === 'pending' ? (
                                                                    <>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="w-10 h-10 rounded-2xl text-red-400 hover:bg-red-50"
                                                                            onClick={() => updateStatusMutation.mutate({ regId: reg.registrationId, status: 'rejected' })}
                                                                            disabled={updateStatusMutation.isPending}
                                                                        >
                                                                            <X className="w-5 h-5" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            className="w-10 h-10 rounded-2xl clay-btn-emerald"
                                                                            onClick={() => updateStatusMutation.mutate({ regId: reg.registrationId, status: 'approved' })}
                                                                            disabled={updateStatusMutation.isPending}
                                                                        >
                                                                            <Check className="w-5 h-5" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] font-black text-slate-300 uppercase">Step completed</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
