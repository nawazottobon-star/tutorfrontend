import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { readStoredSession, clearStoredSession, resetSessionHeartbeat } from '@/utils/session';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, Sparkles, Loader2, MessageSquare, ChevronDown, ChevronUp, Users, TrendingUp, Bell, Home, BookOpen, Activity, Zap, Filter, ListFilter, X, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEmailSelection } from '@/hooks/useEmailSelection';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatbotStatsCard } from '@/components/tutor/ChatbotStatsCard';
import { ChatbotOverviewCard } from '@/components/tutor/ChatbotOverviewCard';
import { PerLearnerStatsCard } from '@/components/tutor/PerLearnerStatsCard';



type TutorCourse = {
  courseId: string;
  slug: string;
  title: string;
  description?: string;
  role?: string;
};

type EnrollmentRow = {
  enrollmentId: string;
  enrolledAt: string;
  status: string;
  userId: string;
  fullName: string;
  email: string;
};




type ProgressRow = {
  userId: string;
  fullName: string;
  email: string;
  enrolledAt: string;
  completedModules: number;
  totalModules: number;
  percent: number;
};

enum LearnerStatus {
  NEEDS_SUPPORT = 'NEEDS_SUPPORT',
  MAKING_PROGRESS = 'MAKING_PROGRESS',
  ON_TRACK = 'ON_TRACK',
  COMPLETED = 'COMPLETED'
}

interface Learner extends ProgressRow {
  status: LearnerStatus;
}

type TutorAssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type Cohort = {
  cohortId: string;
  name: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};


type ActivityLearner = {
  eventId?: string;
  userId: string;
  courseId: string;
  fullName?: string | null;
  email?: string | null;
  moduleNo: number | null;
  topicId: string | null;
  topicTitle?: string | null;
  eventType: string;
  derivedStatus: string | null;
  statusReason: string | null;
  createdAt: string;
};

type ActivitySummary = {
  engaged: number;
  attention_drift: number;
  content_friction: number;
  unknown: number;
};

type CourseTopic = {
  topicId: string;
  topicName: string;
  moduleNo: number;
  moduleName?: string;
};

const NumberTicker = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (value > 0 && !hasAnimated.current) {
      animate(count, value, {
        duration: 1.2,
        ease: "easeOut",
      });
      hasAnimated.current = true;
    } else if (hasAnimated.current) {
      count.set(value);
    }
  }, [value]);

  useEffect(() => {
    return rounded.onChange((v) => setDisplayValue(v));
  }, [rounded]);

  return <span>{displayValue}{suffix}</span>;
};

export default function TutorDashboardPage() {
  const session = readStoredSession();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<TutorAssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailFormData, setEmailFormData] = useState({ to: '' as string | string[], fullName: '', subject: '', message: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [isImprovingEmail, setIsImprovingEmail] = useState(false);
  const alertSelection = useEmailSelection();
  const enrollmentSelection = useEmailSelection();
  const [isAssistantSheetOpen, setIsAssistantSheetOpen] = useState(false);
  const assistantChatRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // --- Learner Progress Sort & Filter State ---
  const [progressSort, setProgressSort] = useState<string>('progress-desc');
  const [progressFilters, setProgressFilters] = useState({
    statuses: [] as LearnerStatus[],
    range: 'all' as string,
    incompleteOnly: false
  });

  // --- Engagement & Alerts State ---
  const [activeAlertFilter, setActiveAlertFilter] = useState<'all' | 'engaged' | 'attention_drift' | 'content_friction' | 'unknown'>('all');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const QUICK_PROMPTS = [
    "Which learners are inactive this week?",
    "Summarize course completion by module",
    "Show engagement trends for my classes"
  ];

  // Manual scroll control for assistant chat
  const scrollAssistantToBottom = () => {
    if (assistantChatRef.current) {
      assistantChatRef.current.scrollTo({
        top: assistantChatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollAssistantToLastMessage = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }
    resetSessionHeartbeat();
  }, [session]);

  const headers = useMemo(() => {
    if (!session?.accessToken) return undefined;
    const h = new Headers();
    h.set('Authorization', `Bearer ${session.accessToken}`);
    return h;
  }, [session?.accessToken]);

  const {
    data: coursesResponse,
    isLoading: coursesLoading
  } = useQuery<{ courses: TutorCourse[] }>({
    queryKey: ['tutor-courses'],
    enabled: session?.role === 'tutor' || session?.role === 'admin',
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tutors/me/courses', undefined, headers ? { headers } : undefined);
      return response.json();
    }
  });

  const courses = coursesResponse?.courses ?? [];

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].courseId);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    setAssistantMessages([]);
    setSelectedLearnerId(null);
    setSelectedCohortId(null);
  }, [selectedCourseId]);

  const {
    data: cohortsResponse,
    isLoading: cohortsLoading
  } = useQuery<{ cohorts: Cohort[] }>({
    queryKey: ['tutor-cohorts', selectedCourseId],
    enabled: Boolean(selectedCourseId) && Boolean(headers),
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/tutors/${selectedCourseId}/cohorts`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const cohorts = useMemo(() => {
    return [...(cohortsResponse?.cohorts ?? [])].sort((a, b) => {
      // Sort by startsAt desc, then by name desc as a fallback
      const dateA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const dateB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return b.name.localeCompare(a.name);
    });
  }, [cohortsResponse?.cohorts]);

  useEffect(() => {
    if (cohorts.length > 0 && !selectedCohortId) {
      setSelectedCohortId(cohorts[0].cohortId);
    }
  }, [cohorts, selectedCohortId]);



  const {
    data: enrollmentsResponse,
    isLoading: enrollmentsLoading
  } = useQuery<{ enrollments: EnrollmentRow[] }>({
    queryKey: ['tutor-enrollments', selectedCourseId, selectedCohortId],
    enabled: Boolean(selectedCourseId) && Boolean(headers),
    queryFn: async () => {
      const url = `/api/tutors/${selectedCourseId}/enrollments${selectedCohortId ? `?cohortId=${selectedCohortId}` : ''}`;
      const response = await apiRequest(
        'GET',
        url,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const { data: progressResponse, isLoading: progressLoading } = useQuery<{ learners: ProgressRow[]; totalModules: number }>({
    queryKey: ['tutor-progress', selectedCourseId, selectedCohortId],
    enabled: Boolean(selectedCourseId) && Boolean(headers),
    queryFn: async () => {
      const url = `/api/tutors/${selectedCourseId}/progress${selectedCohortId ? `?cohortId=${selectedCohortId}` : ''}`;
      const response = await apiRequest(
        'GET',
        url,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const getLearnerStatusEnum = (percent: number): LearnerStatus => {
    if (percent === 100) return LearnerStatus.COMPLETED;
    if (percent > 75) return LearnerStatus.ON_TRACK;
    if (percent > 25) return LearnerStatus.MAKING_PROGRESS;
    return LearnerStatus.NEEDS_SUPPORT;
  };

  const allLearners = useMemo<Learner[]>(() => {
    if (!progressResponse?.learners) return [];
    return progressResponse.learners.map(l => ({
      ...l,
      status: getLearnerStatusEnum(l.percent)
    }));
  }, [progressResponse?.learners]);

  const filteredAndSortedLearners = useMemo(() => {
    // 1. Filter First
    let list = allLearners.filter(l => {
      // Status Filter
      if (progressFilters.statuses.length > 0 && !progressFilters.statuses.includes(l.status)) {
        return false;
      }

      // Range Filter
      if (progressFilters.range !== 'all') {
        const [min, max] = progressFilters.range.split('-').map(Number);
        if (l.percent < min || l.percent > max) return false;
      }

      // Incomplete Filter
      if (progressFilters.incompleteOnly && l.completedModules === l.totalModules) {
        return false;
      }

      return true;
    });

    // 2. Then Sort (on a copy/filtered list)
    return [...list].sort((a, b) => {
      switch (progressSort) {
        case 'progress-desc': return b.percent - a.percent;
        case 'progress-asc': return a.percent - b.percent;
        case 'modules-desc': return b.completedModules - a.completedModules;
        case 'name-asc': return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
        case 'name-desc': return b.fullName.localeCompare(a.fullName, undefined, { sensitivity: 'base' });
        default: return 0;
      }
    });
  }, [allLearners, progressSort, progressFilters]);


  const {
    data: topicsResponse,
    isLoading: topicsLoading
  } = useQuery<{ topics: CourseTopic[] }>({
    queryKey: ['tutor-topics', selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/lessons/courses/${selectedCourseId}/topics`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  const {
    data: activityResponse,
    isLoading: activityLoading,
    isFetching: activityFetching,
    error: activityError
  } = useQuery<{ learners: ActivityLearner[]; summary: ActivitySummary }>({
    queryKey: ['activity-summary', selectedCourseId, selectedCohortId],
    enabled: Boolean(selectedCourseId) && Boolean(headers),
    refetchInterval: autoRefreshEnabled ? 30_000 : false,
    queryFn: async () => {
      const url = `/api/activity/courses/${selectedCourseId}/learners${selectedCohortId ? `?cohortId=${selectedCohortId}` : ''}`;
      const response = await apiRequest(
        'GET',
        url,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });

  useEffect(() => {
    if (activityResponse) {
      setLastUpdated(new Date());
    }
  }, [activityResponse]);

  const filteredAlerts = useMemo(() => {
    const list = activityResponse?.learners ?? [];
    if (activeAlertFilter === 'all') return list;
    return list.filter(l => l.derivedStatus === activeAlertFilter);
  }, [activityResponse, activeAlertFilter]);

  const {
    data: historyResponse,
    isLoading: historyLoading,
    isFetching: historyFetching
  } = useQuery<{ events: ActivityLearner[] }>({
    queryKey: ['activity-history', selectedLearnerId, selectedCourseId],
    enabled: Boolean(selectedLearnerId) && Boolean(selectedCourseId) && Boolean(headers),
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        `/api/activity/learners/${selectedLearnerId}/history?courseId=${selectedCourseId}&limit=40`,
        undefined,
        headers ? { headers } : undefined
      );
      return response.json();
    }
  });



  const learnerDirectory = useMemo(() => {
    const map = new Map<string, { fullName?: string; email?: string }>();
    (enrollmentsResponse?.enrollments ?? []).forEach((row) => {
      map.set(row.userId, { fullName: row.fullName, email: row.email });
    });
    (progressResponse?.learners ?? []).forEach((row) => {
      if (!map.has(row.userId)) {
        map.set(row.userId, { fullName: row.fullName, email: row.email });
      }
    });
    return map;
  }, [enrollmentsResponse?.enrollments, progressResponse?.learners]);

  const topicTitleLookup = useMemo(() => {
    const map = new Map<string, { title: string; moduleNo: number; moduleName?: string }>();
    (topicsResponse?.topics ?? []).forEach((topic) => {
      map.set(topic.topicId, { title: topic.topicName, moduleNo: topic.moduleNo, moduleName: topic.moduleName });
    });
    return map;
  }, [topicsResponse?.topics]);

  const activitySummary = activityResponse?.summary ?? { engaged: 0, attention_drift: 0, content_friction: 0, unknown: 0 };
  const statusMeta: Record<
    NonNullable<ActivityLearner['derivedStatus']> | 'unknown',
    { label: string; badgeClass: string; description: string; dotClass: string; icon: string; accentColor: string; bgGradient: string }
  > = {
    engaged: {
      label: 'ENGAGED',
      badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#10B981]',
      dotClass: 'bg-[#10B981]',
      description: 'All focused',
      icon: '🟢',
      accentColor: '#10B981',
      bgGradient: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
    },
    attention_drift: {
      label: 'DRIFTING',
      badgeClass: 'bg-[#FFFBEB] text-[#D97706] border-[#F59E0B]',
      dotClass: 'bg-[#F59E0B]',
      description: 'Needs nudge',
      icon: '🟡',
      accentColor: '#F59E0B',
      bgGradient: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)'
    },
    content_friction: {
      label: 'FRICTION',
      badgeClass: 'bg-[#FEF2F2] text-[#DC2626] border-[#EF4444]',
      dotClass: 'bg-[#EF4444]',
      description: 'Stuck!',
      icon: '🔴',
      accentColor: '#EF4444',
      bgGradient: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)'
    },
    unknown: {
      label: 'UNKNOWN',
      badgeClass: 'bg-[#F9FAFB] text-[#6B7280] border-[#D1D5DB]',
      dotClass: 'bg-[#D1D5DB]',
      description: 'No data',
      icon: '⚪',
      accentColor: '#9CA3AF',
      bgGradient: '#F9FAFB'
    }
  };


  const statusOrder = ['engaged', 'attention_drift', 'content_friction', 'unknown'] as const;

  const selectedLearner = activityResponse?.learners.find((learner) => learner.userId === selectedLearnerId) ?? null;
  const selectedIdentity = selectedLearnerId ? learnerDirectory.get(selectedLearnerId) : null;
  const historyEvents = historyResponse?.events ?? [];
  const sortedHistoryEvents = useMemo(() => {
    return [...historyEvents].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) {
        return diff;
      }
      if (a.eventId && b.eventId && a.eventId !== b.eventId) {
        return a.eventId < b.eventId ? 1 : -1;
      }
      return 0;
    });
  }, [historyEvents]);


  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' });

  const EVENT_LABELS: Record<string, string> = {
    'idle.start': "Learner's attention wandered",
    'idle.end': "Learner is back on track",
    'video.play': 'Video started',
    'video.pause': 'Video paused',
    'video.buffer.start': 'Video buffering',
    'video.buffer.end': 'Video resumed',
    'lesson.view': 'Lesson viewed',
    'lesson.locked_click': 'Locked lesson clicked',
    'quiz.fail': 'Quiz attempt failed',
    'quiz.pass': 'Quiz passed',
    'quiz.retry': 'Quiz retried',
    'quiz.progress': 'Quiz progress updated',
    'progress.snapshot': 'Progress snapshot',
    'persona.change': 'Persona updated',
    'notes.saved': 'Notes saved',
    'cold_call.loaded': 'Cold-call prompt opened',
    'cold_call.submit': 'Cold-call response submitted',
    'cold_call.star': 'Cold-call star awarded',
    'cold_call.response_received': 'Tutor responded to cold-call',
    'tutor.prompt': 'Tutor prompt sent',
    'tutor.response_received': 'Learner is stuck on content',
  };

  const STATUS_REASON_LABELS: Record<string, string> = {
    no_interaction: 'No interaction detected',
    tab_hidden: 'Learner switched tabs',
    tab_visible: 'Learner is back on track',
    video_play: 'Video playing',
    video_pause: 'Video paused',
  };

  function friendlyLabel(source: string, dictionary: Record<string, string>): string {
    const normalized = source.toLowerCase();
    if (dictionary[normalized]) {
      return dictionary[normalized];
    }
    if (/\s/.test(source) || /[()]/.test(source)) {
      return source;
    }
    return source
      .replace(/[._]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function formatEventLabel(eventType: string): string {
    return friendlyLabel(eventType, EVENT_LABELS);
  }

  function formatStatusReason(reason?: string | null): string | null {
    if (!reason) return null;
    return friendlyLabel(reason, STATUS_REASON_LABELS);
  }

  const handleLogout = () => {
    clearStoredSession();
    toast({ title: 'Signed out' });
    setLocation('/become-a-tutor');
  };

  const performAssistantQuery = async (question: string) => {
    if (!selectedCourseId || !question.trim()) {
      return;
    }

    if (!headers) {
      toast({ variant: 'destructive', title: 'Session missing', description: 'Please sign in again.' });
      return;
    }

    const trimmedQuestion = question.trim();
    const userMessage: TutorAssistantMessage = {
      id: `${Date.now()}-${Math.random()}`,
      role: 'user',
      content: trimmedQuestion,
      timestamp: new Date().toISOString()
    };

    setAssistantMessages((prev) => [...prev, userMessage]);
    setAssistantInput('');
    setAssistantLoading(true);

    // Scroll to bottom when user sends a question
    setTimeout(scrollAssistantToBottom, 100);

    try {
      const history = assistantMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await apiRequest(
        'POST',
        '/api/tutors/assistant/query',
        {
          courseId: selectedCourseId,
          cohortId: selectedCohortId,
          question: trimmedQuestion,
          history
        },
        { headers }
      );
      const payload = await response.json();
      const assistantMessage: TutorAssistantMessage = {
        id: `${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: payload?.answer ?? 'No response available.',
        timestamp: new Date().toISOString()
      };
      setAssistantMessages((prev) => [...prev, assistantMessage]);

      // Scroll to the top of the NEW assistant's response
      setTimeout(scrollAssistantToLastMessage, 100);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Assistant unavailable',
        description: error?.message ?? 'Unable to fetch response'
      });
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleAssistantSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performAssistantQuery(assistantInput);
  };

  const handleOpenEmailModal = (students: { email: string; fullName: string } | Array<{ email: string; fullName: string }>) => {
    if (Array.isArray(students)) {
      if (students.length === 0) return;

      if (students.length === 1) {
        // Treat single student as single even if passed as array via bulk selection
        setEmailFormData({ to: students[0].email, fullName: students[0].fullName, subject: '', message: '' });
      } else {
        setEmailFormData({
          to: students.map(s => s.email),
          fullName: `${students.length} selected learners`,
          subject: '',
          message: ''
        });
      }
    } else {
      setEmailFormData({ to: students.email, fullName: students.fullName, subject: '', message: '' });
    }
    setIsEmailModalOpen(true);
  };

  const handleBulkEmail = (source: 'alert' | 'enrollment') => {
    const selection = source === 'alert' ? alertSelection : enrollmentSelection;
    const studentsToEmail: { email: string; fullName: string }[] = [];

    // Gather details for selected emails from reachable data
    const allLearners = [
      ...(enrollmentsResponse?.enrollments ?? []),
      ...(progressResponse?.learners ?? [])
    ];

    selection.selectedEmails.forEach(email => {
      const learner = allLearners.find(l => l.email === email);
      if (learner) {
        studentsToEmail.push({ email: learner.email, fullName: learner.fullName });
      }
    });

    handleOpenEmailModal(studentsToEmail);
  };

  const handleImproveEmail = async () => {
    if (!emailFormData.message.trim() || !headers) return;

    setIsImprovingEmail(true);
    try {
      // Get current course name for context
      const currentCourse = courses.find(c => c.courseId === selectedCourseId);
      const courseName = currentCourse?.title || 'the course';

      const response = await apiRequest(
        'POST',
        '/api/tutors/email/improve',
        {
          message: emailFormData.message,
          learnerName: emailFormData.fullName,
          courseName: courseName
        },
        { headers }
      );

      const data = await response.json();

      if (data.improvedMessage) {
        setEmailFormData({
          ...emailFormData,
          message: data.improvedMessage
        });

        toast({
          title: 'Message improved',
          description: 'Your message has been enhanced. Review and edit if needed before sending.'
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'AI improvement failed',
        description: error?.message || 'Unable to improve message. Please try again.'
      });
    } finally {
      setIsImprovingEmail(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headers) return;

    setEmailSending(true);
    try {
      await apiRequest(
        'POST',
        '/api/tutors/email',
        {
          to: emailFormData.to,
          subject: emailFormData.subject,
          message: emailFormData.message
        },
        { headers }
      );
      toast({
        title: 'Email sent',
        description: Array.isArray(emailFormData.to)
          ? `Your message has been sent to ${emailFormData.to.length} learners.`
          : `Your message to ${emailFormData.fullName} has been sent.`
      });
      setIsEmailModalOpen(false);
      alertSelection.clearSelection();
      enrollmentSelection.clearSelection();
    } catch (error: any) {
      let errorMessage = 'Failed to send email. Please try again.';

      // Attempt to extract structured error details from the response
      if (error instanceof Error && error.message.includes('{')) {
        try {
          const body = JSON.parse(error.message.substring(error.message.indexOf('{')));
          if (body.details) {
            errorMessage = `${body.message} (${body.details})`;
          } else if (body.message) {
            errorMessage = body.message;
          }
        } catch (e) {
          // Fallback to error message
          errorMessage = error.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    }
    finally {
      setEmailSending(false);
    }
  };


  const totalEnrollments = enrollmentsResponse?.enrollments?.length ?? 0;
  const averageProgressPercent = useMemo(() => {
    const learners = progressResponse?.learners ?? [];
    if (learners.length === 0) {
      return 0;
    }
    const total = learners.reduce((acc, learner) => acc + learner.percent, 0);
    return Math.floor(total / learners.length);
  }, [progressResponse?.learners]);

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: Home },
    { id: 'classroom', label: 'Classroom', icon: BookOpen },
    { id: 'monitoring', label: 'Live Monitor', icon: Activity },
    { id: 'copilot', label: 'AI Copilot', icon: Zap }
  ];

  const [activeTab, setActiveTab] = useState('overview');

  const overviewStats = [
    {
      label: 'Active learners',
      value: totalEnrollments,
      suffix: '',
      helper: `${activitySummary.engaged} currently engaged`,
      color: 'text-[#3B82F6]',
      cardClass: 'stat-card-blue',
      icon: Users,
      iconColor: 'text-blue-400'
    },
    {
      label: 'Avg. progress',
      value: averageProgressPercent,
      suffix: '%',
      helper: progressResponse?.totalModules ? `${progressResponse.totalModules} modules tracked` : 'Across current cohort',
      color: 'text-[#10B981]',
      cardClass: 'stat-card-green',
      icon: TrendingUp,
      iconColor: 'text-green-400'
    },
    {
      label: 'Critical alerts',
      value: activitySummary.content_friction,
      suffix: '',
      helper: 'Content friction signals',
      color: 'text-[#EF4444]',
      cardClass: 'stat-card-red',
      icon: Bell,
      iconColor: 'text-red-400',
      isPulsing: true
    }
  ];

  const handleSectionNav = (sectionId: string) => {
    if (sectionId === 'copilot') {
      setIsAssistantSheetOpen(true);
      return;
    }

    if (typeof document === 'undefined') {
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!session) {
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">Use your tutor credentials to access the dashboard.</p>
              <Button onClick={() => setLocation('/become-a-tutor')}>Go to landing page</Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  if (session.role !== 'tutor' && session.role !== 'admin') {
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">This area is only for tutors or admins.</p>
              <Button className="mt-3" onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="min-h-screen">
        <div className="w-full pb-16 pt-6 text-[#1A202C]">
          <section id="overview" className="mb-10">
            {/* Two-Column Hero Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
              <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
                {/* LEFT COLUMN - Welcome Content (40%) */}
                <div className="flex-none lg:w-[420px] space-y-6">
                  {/* Label */}
                  <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#9CA3AF]">
                    TUTOR COMMAND CENTER
                  </p>

                  {/* Heading */}
                  <div>
                    <h1 className="text-[36px] font-bold text-[#1F2937] leading-[1.2] mb-3 font-['Plus_Jakarta_Sans',_'Outfit',_sans-serif]">
                      Welcome back, {session.fullName ?? 'Tutor'}
                    </h1>
                    <p className="text-base text-[#6B7280] leading-[1.6] max-w-[450px]">
                      Monitor every learner signal, respond to alerts, and guide your class from a single surface.
                    </p>
                  </div>

                  {/* Controls Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Select value={selectedCourseId ?? undefined} onValueChange={(value) => setSelectedCourseId(value)}>
                      <SelectTrigger className="w-full sm:w-auto min-w-[280px] border-2 border-[#D1D5DB] bg-white text-left text-[#1F2937] rounded-lg px-4 py-2.5 text-sm font-medium hover:border-[#3B82F6] hover:shadow-sm transition-all">
                        <SelectValue placeholder={coursesLoading ? 'Loading...' : 'Select course'} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.courseId} value={course.courseId}>
                            {course.title} {course.role ? `(${course.role})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      className="text-[#EF4444] text-sm font-medium hover:text-[#DC2626] hover:underline px-4"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>

                  {/* Info Text */}
                  {courses.length > 0 && selectedCourseId && (
                    <p className="text-[13px] text-[#9CA3AF]">
                      Showing data for{' '}
                      <span className="font-medium text-[#6B7280]">
                        {courses.find((c) => c.courseId === selectedCourseId)?.title ?? 'your course'}
                      </span>
                    </p>
                  )}
                </div>

                {/* RIGHT COLUMN - Stats Cards (60%) */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {overviewStats.map((stat) => {
                      const IconComponent = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          whileHover={{
                            y: -2,
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.04)"
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className={`${stat.cardClass} rounded-xl p-5 shadow-sm cursor-default relative overflow-hidden min-h-[140px] flex flex-col`}
                        >
                          {/* Icon in top-right */}
                          <div className="absolute top-5 right-5">
                            <IconComponent
                              className={`w-6 h-6 ${stat.iconColor} ${stat.isPulsing ? 'pulse-alert' : 'icon-bounce'}`}
                            />
                          </div>

                          {/* Label */}
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                            {stat.label}
                          </p>

                          {/* Number */}
                          <div className={`text-[48px] font-bold leading-none tracking-tight ${stat.color} stat-number mb-2 flex-1 flex items-center`}>
                            <NumberTicker value={stat.value} suffix={stat.suffix} />
                          </div>

                          {/* Helper text */}
                          <p className="text-[13px] text-[#9CA3AF] font-medium">
                            {stat.helper}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Modern Pill Navigation */}
          <nav className="mt-8 inline-flex bg-[#F9FAFB] p-2 rounded-xl gap-2" aria-label="Tutor sections">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    handleSectionNav(item.id);
                  }}
                  className={`tab-transition rounded-full px-6 py-3 text-sm font-medium flex items-center gap-2 ${isActive ? 'tab-pill-active' : 'tab-pill-inactive'
                    }`}
                >
                  <ItemIcon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <section id="classroom" className="mt-12 space-y-6">
            {/* Clean Section Header */}
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#9CA3AF] mb-2">CLASSROOM</p>
              <h2 className="text-[28px] font-bold text-[#1F2937] mb-2">Roster & Throughput</h2>
              <div className="h-[3px] w-[40px] bg-[#10B981] rounded-full mb-3"></div>
              <p className="text-[15px] text-[#6B7280]">Stay on top of enrollments and module completion at a glance.</p>
            </div>

            {/* Two-Column Grid Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-[#E5E7EB] bg-white text-[#1A202C] shadow-md rounded-xl overflow-hidden h-[600px] flex flex-col">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-[20px] font-bold text-[#1F2937]">Enrollments</CardTitle>
                      <p className="text-[13px] text-[#9CA3AF] mt-1">{totalEnrollments} learners in the cohort</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {enrollmentSelection.selectedEmails.size > 0 && (
                        <Button
                          onClick={() => handleBulkEmail('enrollment')}
                          size="sm"
                          className="bg-[#2D3748] text-white hover:bg-[#1A202C] animate-in fade-in zoom-in duration-200 shrink-0"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Email Group ({enrollmentSelection.selectedEmails.size})
                        </Button>
                      )}
                      <Select value={selectedCohortId ?? undefined} onValueChange={(value) => setSelectedCohortId(value)}>
                        <SelectTrigger className="w-full border-[#E2E8F0] bg-white text-left text-[#1A202C] sm:w-[220px]">
                          <SelectValue placeholder={cohortsLoading ? 'Loading cohorts...' : 'Select cohort batch'} />
                        </SelectTrigger>
                        <SelectContent>
                          {cohorts.map((cohort) => (
                            <SelectItem key={cohort.cohortId} value={cohort.cohortId}>
                              {cohort.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  {enrollmentsLoading ? (
                    <p className="text-sm text-[#718096] p-6">Loading enrollments...</p>
                  ) : (enrollmentsResponse?.enrollments ?? []).length === 0 ? (
                    <p className="text-sm text-[#718096] p-6">No enrollments yet.</p>
                  ) : (
                    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#E2E8F0] scrollbar-track-transparent hover:scrollbar-thumb-[#CBD5E0] scroll-smooth">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-white">
                          <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB] border-b border-[#E5E7EB] h-14 shadow-sm">
                            <TableHead className="w-12 py-0 align-middle text-center">
                              <Checkbox
                                checked={enrollmentSelection.isAllSelected((enrollmentsResponse?.enrollments ?? []).map(e => e.email))}
                                onCheckedChange={() => enrollmentSelection.toggleSelectAll((enrollmentsResponse?.enrollments ?? []).map(e => e.email))}
                                className="border-[#D1D5DB] data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                              />
                            </TableHead>
                            <TableHead className="text-[#6B7280] text-[11px] font-bold uppercase tracking-[0.5px] px-6 align-middle">Learner</TableHead>
                            <TableHead className="text-[#6B7280] text-[11px] font-bold uppercase tracking-[0.5px] px-6 align-middle">Email</TableHead>
                            <TableHead className="text-[#6B7280] text-[11px] font-bold uppercase tracking-[0.5px] px-6 align-middle text-center">Status</TableHead>
                            <TableHead className="text-[#6B7280] text-[11px] font-bold uppercase tracking-[0.5px] px-6 align-middle text-center">Enrolled</TableHead>

                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(enrollmentsResponse?.enrollments ?? []).map((enrollment) => {
                            const progressInfo = allLearners.find(l => l.userId === enrollment.userId);
                            const status = progressInfo?.status || LearnerStatus.NEEDS_SUPPORT;
                            const percent = progressInfo?.percent || 0;
                            const completed = progressInfo?.completedModules ?? 0;
                            const total = progressInfo?.totalModules ?? 0;

                            const statusStyles: Record<LearnerStatus, { border: string, bg: string, text: string, label: string }> = {
                              [LearnerStatus.NEEDS_SUPPORT]: { border: '#EF4444', bg: '#FEF2F2', text: '#DC2626', label: 'Needs Support' },
                              [LearnerStatus.MAKING_PROGRESS]: { border: '#F59E0B', bg: '#FFFBEB', text: '#D97706', label: 'Making Progress' },
                              [LearnerStatus.ON_TRACK]: { border: '#10B981', bg: '#F0FDF4', text: '#059669', label: 'On Track' },
                              [LearnerStatus.COMPLETED]: { border: '#3B82F6', bg: '#EFF6FF', text: '#2563EB', label: 'Completed' },
                            };

                            const style = statusStyles[status];

                            return (
                              <TableRow
                                key={enrollment.enrollmentId}
                                className="border-b border-[#EDF2F7] cursor-pointer group/row transition-all duration-200 h-16"
                                style={{ borderLeft: `4px solid ${style.border}` }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = style.bg;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <TableCell className="w-12 py-0 align-middle text-center">
                                  <Checkbox
                                    checked={enrollmentSelection.selectedEmails.has(enrollment.email)}
                                    onCheckedChange={() => enrollmentSelection.toggleEmailSelection(enrollment.email)}
                                    className="border-[#CBD5E0] data-[state=checked]:bg-[#2D3748] data-[state=checked]:border-[#2D3748]"
                                  />
                                </TableCell>
                                <TableCell className="px-6 py-0 align-middle">
                                  <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#4A5568] font-bold text-[14px] leading-tight group-hover/row:text-[#1A202C] transition-colors">{enrollment.fullName}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 rounded-full text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEmailModal({ email: enrollment.email, fullName: enrollment.fullName });
                                        }}
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                    <span className="text-[11px] text-[#9CA3AF] mt-0.5 font-medium whitespace-nowrap">
                                      {total > 0 ? `${completed}/${total} modules completed` : 'No modules started'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-0 align-middle">
                                  <span className="text-[13px] text-[#718096] font-medium block truncate max-w-[180px]">
                                    {enrollment.email}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-0 align-middle text-center">
                                  <div className="flex justify-center">
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap min-w-[125px] h-8 flex items-center justify-center border transition-all"
                                      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border + '40' }}
                                    >
                                      {style.label}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-0 align-middle text-center">
                                  <span className="text-[12px] font-bold text-[#4A5568] tabular-nums whitespace-nowrap">
                                    {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </TableCell>

                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-[#E5E7EB] bg-white text-[#1A202C] shadow-md rounded-xl overflow-hidden h-[600px] flex flex-col">
                <CardHeader className="border-b-2 border-[#F3F4F6] p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <CardTitle className="text-2xl font-bold text-[#1F2937]">Learner Progress</CardTitle>
                      </div>
                      <div className="w-[60px] h-1 bg-gradient-to-r from-[#10B981] to-[#3B82F6] rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Sort Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className={`bg-[#F3F4F6] border-[#D1D5DB] text-[#4B5563] font-medium rounded-lg px-4 hover:bg-[#E5E7EB] transition-colors ${progressSort !== 'progress-desc' ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/20' : ''}`}>
                            <TrendingUp className="mr-2 h-3.5 w-3.5" />
                            Sort <span className="ml-1 text-[10px]">▼</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup value={progressSort} onValueChange={setProgressSort}>
                            <DropdownMenuRadioItem value="progress-desc" className="cursor-pointer">Progress (High → Low)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="progress-asc" className="cursor-pointer">Progress (Low → High)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="modules-desc" className="cursor-pointer">Modules Completed (High → Low)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="name-asc" className="cursor-pointer">Name (A → Z)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="name-desc" className="cursor-pointer">Name (Z → A)</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Filter Popover */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={`bg-[#F3F4F6] border-[#D1D5DB] text-[#4B5563] font-medium rounded-lg px-4 hover:bg-[#E5E7EB] transition-colors relative ${progressFilters.statuses.length > 0 || progressFilters.range !== 'all' || progressFilters.incompleteOnly ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/20' : ''}`}>
                            <ListFilter className="mr-2 h-3.5 w-3.5" />
                            Filter <span className="ml-1 text-[10px]">▼</span>
                            {(progressFilters.statuses.length + (progressFilters.range !== 'all' ? 1 : 0) + (progressFilters.incompleteOnly ? 1 : 0)) > 0 && (
                              <Badge className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-[#3B82F6] border-2 border-white">
                                {progressFilters.statuses.length + (progressFilters.range !== 'all' ? 1 : 0) + (progressFilters.incompleteOnly ? 1 : 0)}
                              </Badge>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">Filter Learners</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setProgressFilters({ statuses: [], range: 'all', incompleteOnly: false })}
                                className="h-7 px-2 text-xs text-[#3B82F6] hover:text-[#2563EB] hover:bg-blue-50"
                              >
                                Clear All
                              </Button>
                            </div>
                            <DropdownMenuSeparator />

                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">By Status</Label>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {[
                                  { value: LearnerStatus.NEEDS_SUPPORT, label: 'Needs Support' },
                                  { value: LearnerStatus.MAKING_PROGRESS, label: 'Making Progress' },
                                  { value: LearnerStatus.ON_TRACK, label: 'On Track' },
                                  { value: LearnerStatus.COMPLETED, label: 'Completed' }
                                ].map(({ value, label }) => (
                                  <div key={value} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`status-${value}`}
                                      className="h-4 w-4"
                                      checked={progressFilters.statuses.includes(value)}
                                      onCheckedChange={(checked) => {
                                        setProgressFilters(prev => ({
                                          ...prev,
                                          statuses: checked
                                            ? [...prev.statuses, value]
                                            : prev.statuses.filter(s => s !== value)
                                        }));
                                      }}
                                    />
                                    <Label htmlFor={`status-${value}`} className="text-xs font-medium cursor-pointer leading-none">{label}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2 pt-1">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Progress Range</Label>
                              <Select value={progressFilters.range} onValueChange={(val) => setProgressFilters(prev => ({ ...prev, range: val }))}>
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="All progress levels" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all" className="text-xs">All Progress Levels</SelectItem>
                                  <SelectItem value="0-25" className="text-xs">0% - 25% (Critical)</SelectItem>
                                  <SelectItem value="26-50" className="text-xs">26% - 50% (Emerging)</SelectItem>
                                  <SelectItem value="51-75" className="text-xs">51% - 75% (Improving)</SelectItem>
                                  <SelectItem value="76-100" className="text-xs">76% - 100% (Advanced)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center space-x-2 pt-2 border-t border-[#F3F4F6]">
                              <Checkbox
                                id="incomplete-only"
                                className="h-4 w-4"
                                checked={progressFilters.incompleteOnly}
                                onCheckedChange={(checked) => setProgressFilters(prev => ({ ...prev, incompleteOnly: !!checked }))}
                              />
                              <Label htmlFor="incomplete-only" className="text-xs font-semibold cursor-pointer text-[#4B5563]">Show only incomplete modules</Label>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[#6B7280]">Average:</span>
                      <span className={`text-2xl font-bold ${averageProgressPercent < 30 ? 'text-[#EF4444]' : 'text-[#3B82F6]'}`}>
                        {averageProgressPercent}%
                      </span>
                      <span className="text-[#6B7280] ml-1">across {progressResponse?.totalModules ?? 0} modules</span>
                    </div>
                    <span className="text-[#E5E7EB]">•</span>
                    <div className="flex items-center gap-1.5 text-[#F59E0B]">
                      <span>⚠️</span>
                      <span>{(progressResponse?.learners ?? []).filter(l => l.percent < 30).length} need attention</span>
                    </div>
                    <span className="text-[#E5E7EB]">•</span>
                    <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                      <span>✅</span>
                      <span>{(progressResponse?.learners ?? []).filter(l => l.percent === 100).length} completed</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  {progressLoading ? (
                    <p className="text-sm text-[#718096] p-6">Loading progress...</p>
                  ) : (progressResponse?.learners ?? []).length === 0 ? (
                    <p className="text-sm text-[#718096] p-6">No progress yet.</p>
                  ) : (
                    <div className="relative group/scroll h-full">
                      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#E2E8F0] scrollbar-track-transparent hover:scrollbar-thumb-[#CBD5E0] scroll-smooth">
                        {filteredAndSortedLearners.length === 0 ? (
                          <div className="py-20 text-center bg-[#F9FAFB] rounded-xl border-2 border-dashed border-[#E5E7EB] mt-4 flex flex-col items-center justify-center">
                            <div className="bg-[#F3F4F6] w-14 h-14 rounded-full flex items-center justify-center mb-4 text-[#9CA3AF]">
                              <Filter className="w-6 h-6" />
                            </div>
                            <h3 className="text-[#1F2937] font-bold text-lg">No learners match the selected filters.</h3>
                            <p className="text-[#6B7280] text-sm mt-1 max-w-[250px] mx-auto">Try adjusting your filters to find who you're looking for.</p>
                            <Button
                              variant="outline"
                              className="mt-6 border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50"
                              onClick={() => setProgressFilters({ statuses: [], range: 'all', incompleteOnly: false })}
                            >
                              Reset all filters
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-0">
                            {(() => {
                              const learners = filteredAndSortedLearners;
                              // Unique avatar gradients for visual differentiation
                              const avatarGradients = [
                                'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                                'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                                'linear-gradient(135deg, #A8E6CF 0%, #3DDC84 100%)',
                                'linear-gradient(135deg, #FFA07A 0%, #FFD93D 100%)',
                                'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                              ];
                              return learners.map((learner, index) => {
                                // Determine color theme based on progress
                                const getProgressTheme = (percent: number) => {
                                  if (percent === 0) return {
                                    color: '#EF4444',
                                    gradient: 'linear-gradient(90deg, #FEE2E2 0%, #FEE2E2 100%)',
                                    borderColor: '#EF4444',
                                    textColor: '#DC2626',
                                    icon: '⚠️',
                                    message: 'Not started yet',
                                    messageColor: '#9CA3AF'
                                  };
                                  if (percent <= 25) return {
                                    color: '#EF4444',
                                    gradient: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                                    borderColor: '#EF4444',
                                    textColor: '#DC2626',
                                    icon: '🔴',
                                    message: 'Needs support',
                                    messageColor: '#DC2626'
                                  };
                                  if (percent <= 50) return {
                                    color: '#F59E0B',
                                    gradient: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                                    borderColor: '#F59E0B',
                                    textColor: '#D97706',
                                    icon: '🟡',
                                    message: 'Making progress',
                                    messageColor: '#D97706'
                                  };
                                  if (percent <= 75) return {
                                    color: '#3B82F6',
                                    gradient: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)',
                                    borderColor: '#3B82F6',
                                    textColor: '#2563EB',
                                    icon: '🔵',
                                    message: 'On track!',
                                    messageColor: '#2563EB'
                                  };
                                  if (percent < 100) return {
                                    color: '#10B981',
                                    gradient: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                                    borderColor: '#10B981',
                                    textColor: '#059669',
                                    icon: '🟢',
                                    message: 'Almost there!',
                                    messageColor: '#059669'
                                  };
                                  return {
                                    color: '#FFD700',
                                    gradient: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                                    borderColor: '#FFD700',
                                    textColor: '#FFA500',
                                    icon: '✅',
                                    message: 'Completed! 🎉',
                                    messageColor: '#059669'
                                  };
                                };

                                const theme = getProgressTheme(learner.percent);
                                const avatarGradient = avatarGradients[index % avatarGradients.length];

                                // Determine hover background based on progress
                                const getHoverBg = (percent: number) => {
                                  if (percent <= 25) return '#FEF2F2';
                                  if (percent <= 50) return '#FFFBEB';
                                  if (percent <= 75) return '#EFF6FF';
                                  if (percent < 100) return '#F0FDF4';
                                  return '#FFFBEB';
                                };

                                return (
                                  <div
                                    key={learner.userId}
                                    className="border-b border-[#F3F4F6] transition-all duration-300 cursor-pointer group/row relative"
                                    style={{
                                      borderLeft: `5px solid ${theme.borderColor}`
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = getHoverBg(learner.percent);
                                      e.currentTarget.style.transform = 'translateX(2px)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.transform = 'translateX(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <div className="grid grid-cols-12 gap-4 items-center py-4 px-6">
                                      {/* Student Info - 5 columns */}
                                      <div className="col-span-5">
                                        <div className="flex items-center gap-3">

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 group/name_row">
                                              <div className="font-semibold text-[15px] text-[#1F2937] truncate group-hover/row:text-[#3B82F6] transition-colors leading-tight">
                                                {learner.fullName}
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover/name_row:opacity-100 transition-all hover:bg-blue-50 text-[#3B82F6] shrink-0"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleOpenEmailModal({ email: learner.email, fullName: learner.fullName });
                                                }}
                                              >
                                                <Mail className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                            <div className="text-[12px] text-[#9CA3AF] truncate flex items-center gap-1 mt-0.5">
                                              <span className="text-[11px]">✉️</span>
                                              {learner.email}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 font-bold text-[10px] uppercase tracking-wider">
                                              <span className={`h-1.5 w-1.5 rounded-full ${learner.percent === 0 ? 'bg-gray-400' : learner.percent < 30 ? 'bg-red-500' : 'bg-green-500'}`} />
                                              <span style={{ color: learner.percent === 0 ? '#9CA3AF' : learner.percent < 30 ? '#EF4444' : '#10B981' }}>
                                                {learner.percent === 0 ? 'Not started' : learner.percent < 30 ? 'Attention' : 'On Track'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Module Count with Dots - 3 columns */}
                                      <div className="col-span-3 text-center">
                                        <div
                                          className="text-[20px] font-bold leading-none mb-1"
                                          style={{ color: theme.textColor }}
                                        >
                                          {learner.completedModules}/{learner.totalModules}
                                        </div>
                                        <div className="flex justify-center gap-1 mt-1">
                                          {Array.from({ length: learner.totalModules }).map((_, i) => (
                                            <div
                                              key={i}
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{
                                                backgroundColor: i < learner.completedModules ? theme.color : '#D1D5DB',
                                                opacity: i < learner.completedModules ? 1 : 0.3
                                              }}
                                            />
                                          ))}
                                        </div>
                                        <div className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-widest mt-1">modules</div>
                                      </div>

                                      {/* Progress Bar + Status - 4 columns */}
                                      <div className="col-span-4">
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-3">
                                            <div className="flex-1 h-3 rounded-full bg-[#F3F4F6] overflow-hidden shadow-inner border border-[#E5E7EB]">
                                              <div
                                                className="h-full rounded-full transition-all duration-1500 ease-out"
                                                style={{
                                                  width: `${learner.percent}%`,
                                                  background: theme.gradient
                                                }}
                                              />
                                            </div>
                                            <div className="flex items-center gap-1 min-w-[65px] justify-end">
                                              <span className="text-sm">{theme.icon}</span>
                                              <span className="text-[16px] font-bold" style={{ color: theme.textColor }}>
                                                {learner.percent}%
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-[10px] font-bold pl-0.5 uppercase tracking-wide" style={{ color: theme.messageColor }}>
                                            {theme.message}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent opacity-60" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div >
          </section >

          <section id="monitoring" className="mt-12 space-y-6">
            {/* 1. SECTION HEADER - Compact */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚨</span>
                <h2 className="text-[20px] font-bold text-[#1F2937] tracking-tight">Monitoring Strip</h2>
                <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
                <p className="text-[12px] font-medium text-[#6B7280] hidden sm:block">Real-time engagement telemetry</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {activityFetching ? 'Syncing...' : `${Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)}s ago`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-white rounded-md transition-all"
                    onClick={() => activityResponse && setLastUpdated(new Date())}
                  >
                    <Activity className={`w-3 h-3 text-slate-500 ${activityFetching ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ease-in-out ${autoRefreshEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${autoRefreshEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight cursor-pointer">Live</Label>
                </div>
              </div>
            </div>

            {/* 2. MONITORING STRIP - High Density Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {statusOrder.filter(k => k !== 'unknown').map((key) => {
                const meta = statusMeta[key];
                const count = activitySummary[key as keyof ActivitySummary];
                const isActive = activeAlertFilter === key;
                const isCritical = key === 'content_friction' && count > 0;

                return (
                  <motion.div
                    key={key}
                    whileHover={{ y: -2 }}
                    onClick={() => setActiveAlertFilter(isActive ? 'all' : key as any)}
                    className={`relative cursor-pointer h-[90px] rounded-xl p-3 px-4 transition-all duration-200 border flex items-center gap-4 group
                      ${isActive ? 'ring-1 ring-blue-500 bg-blue-50/10' : 'bg-white'}
                    `}
                    style={{
                      borderColor: isActive ? '#3B82F6' : meta.accentColor + '30',
                      boxShadow: isCritical ? `0 0 15px ${meta.accentColor}20` : 'none'
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0"
                      style={{ background: meta.bgGradient, color: meta.accentColor }}
                    >
                      {meta.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className={`text-[10px] font-black tracking-widest uppercase ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                          {meta.label}
                        </span>
                        {isCritical && (
                          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: isActive ? '#3B82F6' : meta.accentColor }}>
                          {count}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase truncate">
                          {meta.description.split(' ')[0]} {key === 'engaged' ? 'Flow' : 'Alerts'}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <X className="w-3 h-3 text-blue-500" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 mt-12">
              {/* LEFT PANEL: ALERT FEED (60%) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                      <Bell className="w-5 h-5 text-slate-600 group-hover:animate-bounce transition-transform" />
                      {filteredAlerts.some(l => l.derivedStatus === 'content_friction') && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Alert Feed</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {activityFetching ? (
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Refreshing telemetry...
                          </span>
                        ) : (
                          'Auto-refreshes every 30 seconds'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {alertSelection.selectedEmails.size > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2D3748] rounded-full shadow-lg animate-in slide-in-from-right-4 duration-300">
                        <span className="text-[11px] font-bold text-white px-2 border-r border-slate-600">
                          {alertSelection.selectedEmails.size} Selected
                        </span>
                        <div className="flex items-center gap-1 pl-1">
                          <Button
                            onClick={() => handleBulkEmail('alert')}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px] text-white hover:bg-white/10"
                          >
                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                            Email
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px] text-white hover:bg-white/10"
                            onClick={() => alertSelection.clearSelection()}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                      <Checkbox
                        id="select-all-alerts"
                        checked={alertSelection.isAllSelected((activityResponse?.learners ?? []).map(l => l.email).filter((e): e is string => !!e))}
                        onCheckedChange={() => alertSelection.toggleSelectAll((activityResponse?.learners ?? []).map(l => l.email).filter((e): e is string => !!e))}
                        className="border-[#CBD5E0] shadow-sm data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                      />
                      <label htmlFor="select-all-alerts" className="text-[11px] font-black uppercase tracking-wider text-slate-500 cursor-pointer select-none">
                        Select All
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 max-h-[850px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {activityError ? (
                    <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-2xl p-8 text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-6 h-6 text-red-500" />
                      </div>
                      <h4 className="font-bold text-red-900">Connection Interrupted</h4>
                      <p className="text-red-700 text-sm mt-1">Unable to load learner telemetry right now. Please retry shortly.</p>
                      <Button onClick={() => activityResponse && setLastUpdated(new Date())} variant="outline" className="mt-4 border-red-200 text-red-700 hover:bg-red-100">Retry Manual Refresh</Button>
                    </div>
                  ) : activityLoading ? (
                    <div className="space-y-4">
                      {[0, 1, 2, 3].map((index) => (
                        <Skeleton key={index} className="h-32 w-full rounded-2xl bg-slate-50 border border-slate-100" />
                      ))}
                    </div>
                  ) : filteredAlerts.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center animate-in fade-in duration-500">
                      <div className="text-6xl mb-4">✅</div>
                      <h3 className="text-xl font-bold text-slate-800">All learners engaged!</h3>
                      <p className="text-slate-500 text-sm mt-1 max-w-[280px]">No alerts found for the current filter. Everything looks steady.</p>
                      {activeAlertFilter !== 'all' && (
                        <Button
                          variant="outline"
                          className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => setActiveAlertFilter('all')}
                        >
                          Clear Active Filter
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 pb-20">
                      {filteredAlerts.map((learner) => {
                        const directoryIdentity = learnerDirectory.get(learner.userId);
                        const identity = {
                          fullName: learner.fullName || directoryIdentity?.fullName || 'Anonymous Learner',
                          email: learner.email || directoryIdentity?.email
                        };
                        const key = (learner.derivedStatus ?? 'unknown') as keyof typeof statusMeta;
                        const meta = statusMeta[key];
                        const isActive = selectedLearnerId === learner.userId;

                        // Signal Text Mapping
                        let signalText = "Needs support";
                        if (key === 'engaged') signalText = "On track";
                        else if (key === 'attention_drift') signalText = "Drifting";
                        else if (key === 'content_friction') signalText = "Stuck on content";

                        let priorityStyles = {
                          border: '1px solid #E2E8F0',
                          bg: 'white',
                          shadow: 'none',
                          pulse: false,
                          pillClass: 'bg-slate-100 text-slate-600 border-slate-200'
                        };

                        if (key === 'content_friction') {
                          priorityStyles = {
                            border: '1px solid #FCA5A5',
                            bg: '#FEF2F2',
                            shadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)',
                            pulse: true,
                            pillClass: 'bg-red-100 text-red-700 border-red-200'
                          };
                        } else if (key === 'attention_drift') {
                          priorityStyles = {
                            border: '1px solid #FDBA74',
                            bg: '#FFF7ED',
                            shadow: 'none',
                            pulse: false,
                            pillClass: 'bg-orange-100 text-orange-700 border-orange-200'
                          };
                        } else if (key === 'engaged') {
                          priorityStyles = {
                            border: '1px solid #E2E8F0',
                            bg: 'white',
                            shadow: 'none',
                            pulse: false,
                            pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          };
                        } else if (isActive) {
                          priorityStyles = {
                            border: '1px solid #3B82F6',
                            bg: '#EFF6FF',
                            shadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
                            pulse: false,
                            pillClass: 'bg-blue-100 text-blue-700 border-blue-200'
                          };
                        }

                        // Relative time helper
                        const timeDiff = Math.floor((new Date().getTime() - new Date(learner.createdAt).getTime()) / 60000);
                        const timeString = timeDiff < 1 ? 'Just now' : timeDiff < 60 ? `${timeDiff}m ago` : `${Math.floor(timeDiff / 60)}h ago`;

                        // Avatar Gradient
                        const avatarGradients = [
                          'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                          'linear-gradient(135deg, #4ECDC4, #44A08D)',
                          'linear-gradient(135deg, #6C5CE7, #A29BFE)',
                          'linear-gradient(135deg, #FFA07A, #FFD93D)'
                        ];
                        const avatarBg = avatarGradients[Math.abs(learner.userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % avatarGradients.length];

                        return (
                          <motion.div
                            key={learner.userId}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            whileHover={{ scale: 1.01 }}
                            className={`relative flex items-center p-3 rounded-xl border transition-all cursor-pointer group/alert
                              ${isActive ? 'ring-1 ring-blue-500' : ''}
                            `}
                            style={{
                              backgroundColor: priorityStyles.bg,
                              borderColor: isActive ? '#3B82F6' : priorityStyles.border.split(' ')[2] || '#E2E8F0',
                              boxShadow: priorityStyles.shadow
                            }}
                            onClick={() => setSelectedLearnerId(learner.userId)}
                          >
                            {/* Checkbox */}
                            <div className="mr-3 flex items-center">
                              <Checkbox
                                checked={identity?.email ? alertSelection.selectedEmails.has(identity.email) : false}
                                onCheckedChange={() => identity?.email && alertSelection.toggleEmailSelection(identity.email)}
                                onClick={(e) => e.stopPropagation()}
                                className={`h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]
                                  ${alertSelection.selectedEmails.size > 0 ? 'opacity-100' : 'opacity-0 group-hover/alert:opacity-100'} transition-opacity`}
                              />
                            </div>

                            {/* Avatar */}
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ring-1 ring-white shrink-0 mr-3"
                              style={{ background: avatarBg }}
                            >
                              {identity.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 text-sm truncate leading-none">
                                  {identity.fullName}
                                </h4>
                                <span className="text-[11px] font-medium text-slate-500 leading-none">
                                  {signalText}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-[4px] border leading-none ${priorityStyles.pillClass}`}>
                                  {meta.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium leading-none">
                                  {timeString}
                                </span>
                              </div>
                            </div>

                            {/* Action */}
                            {identity?.email && (
                              <div className="ml-2 opacity-0 group-hover/alert:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEmailModal({ email: identity.email!, fullName: identity.fullName });
                                  }}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </div>
                            )}

                            {/* Active Indicator Strip */}
                            {isActive && (
                              <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: LEARNER DETAIL (40%) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                <Card className="border-2 border-slate-100 bg-white text-[#1A202C] shadow-xl rounded-3xl overflow-hidden flex flex-col">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Learner Detail</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                          {selectedIdentity?.fullName ?? 'Select Learner'}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {selectedLearnerId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-slate-200"
                            onClick={() => setSelectedLearnerId(null)}
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </Button>
                        )}
                        {selectedLearner && (
                          <Badge
                            variant="secondary"
                            className={`${statusMeta[(selectedLearner.derivedStatus ?? 'unknown') as keyof typeof statusMeta].badgeClass} border font-black text-[10px] px-2.5 py-1`}
                          >
                            {statusMeta[(selectedLearner.derivedStatus ?? 'unknown') as keyof typeof statusMeta].label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-8">
                    {!selectedLearnerId ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
                          <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No profile selected</h3>
                        <p className="text-sm text-slate-500 max-w-[220px] mx-auto mt-2 leading-relaxed">
                          Click any alert on the left to analyze learner engagement and activity patterns.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">


                        {/* TIMELINE */}
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Activity Timeline
                          </p>
                          <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            {historyLoading || historyFetching ? (
                              <div className="space-y-4">
                                {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-50" />)}
                              </div>
                            ) : sortedHistoryEvents.length === 0 ? (
                              <div className="bg-slate-50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200">
                                <p className="text-sm text-slate-500 font-medium">No history recorded yet.</p>
                              </div>
                            ) : (
                              <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                                {sortedHistoryEvents.map((event, index) => {
                                  const meta = statusMeta[(event.derivedStatus ?? 'unknown') as keyof typeof statusMeta];
                                  const eventLabel = formatEventLabel(event.eventType);
                                  const reasonLabel = formatStatusReason(event.statusReason);
                                  return (
                                    <div key={event.eventId ?? index} className="relative">
                                      <div
                                        className={`absolute -left-[27px] top-1.5 h-4 w-4 rounded-full border-4 border-white shadow-sm z-10`}
                                        style={{ backgroundColor: meta.accentColor }}
                                      ></div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-bold text-slate-400">{formatTimestamp(event.createdAt)}</span>
                                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${meta.badgeClass} border-transparent`}>
                                            {meta.label}
                                          </span>
                                        </div>
                                        <h4 className="text-[14px] font-black text-slate-800 leading-tight">{eventLabel}</h4>
                                        {reasonLabel && <p className="text-[12px] text-slate-500 italic font-medium">"{reasonLabel}"</p>}
                                        <div className="flex items-center gap-2 pt-1">
                                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {(() => {
                                              const topicMeta = event.topicId ? topicTitleLookup.get(event.topicId) : null;
                                              return topicMeta ? topicMeta.moduleName ?? `Module ${topicMeta.moduleNo}` : `Module ${event.moduleNo ?? 'n/a'}`;
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>


                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Chatbot Interaction Stats Section */}
          <section id="chatbot-stats" className="mt-8 space-y-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#718096]">Chatbot Analytics</p>
              <h2 className="text-xl font-semibold text-[#1A202C]">Learner Chatbot Interactions</h2>
              <p className="text-xs text-[#718096]">
                Track how learners use the AI chatbot and analyze their question patterns.
              </p>
            </div>
            {/* Cohort Overview */}
            <ChatbotOverviewCard
              courseId={selectedCourseId || ''}
              cohortId={selectedCohortId}
              headers={headers}
            />

            {/* Individual Learner Stats */}
            <PerLearnerStatsCard
              courseId={selectedCourseId || ''}
              cohortId={selectedCohortId}
              headers={headers}
            />


          </section>
        </div >

        {/* Persistent AI Copilot Button - Anchored horizontally to white surface, fixed to viewport bottom */}
        {
          !isAssistantSheetOpen && (
            <div className="fixed inset-x-0 bottom-6 z-50 pointer-events-none">
              <div className="mx-auto max-w-[96%] px-6 sm:px-10 flex justify-end">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="pointer-events-auto"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 0 0px rgba(16, 185, 129, 0)",
                        "0 0 0 10px rgba(16, 185, 129, 0.2)",
                        "0 0 0 0px rgba(16, 185, 129, 0)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="rounded-full"
                  >
                    <Button
                      onClick={() => setIsAssistantSheetOpen(true)}
                      className="h-12 px-6 rounded-full bg-[#2D3748] hover:bg-[#1A202C] text-white shadow-xl flex items-center gap-2 group transition-all hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      <span className="font-semibold tracking-tight text-sm">AI Copilot</span>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          )
        }

        {/* AI Copilot Side Panel (Sheet) */}
        <Sheet open={isAssistantSheetOpen} onOpenChange={setIsAssistantSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-[400px] md:max-w-[450px] p-0 border-l border-slate-200 bg-white flex flex-col">
            <SheetHeader className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Sparkles className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold">AI Copilot</p>
              </div>
              <SheetTitle className="text-xl font-bold text-slate-900">Classroom Analyst</SheetTitle>
            </SheetHeader>

            {/* Quick Suggestions */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Quick Suggestions</p>
              <div className="flex flex-col gap-2">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => performAssistantQuery(prompt)}
                    className="text-left text-sm p-3 rounded-xl border-2 border-emerald-100 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-slate-700 hover:text-emerald-700 font-medium shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={assistantChatRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {assistantMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
                  <div className="p-4 rounded-full bg-slate-100">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 max-w-[200px]">
                    Ask about enrollments, stuck learners, or classroom engagement.
                  </p>
                </div>
              ) : (
                assistantMessages.map((message, idx) => (
                  <div
                    key={message.id}
                    ref={idx === assistantMessages.length - 1 ? lastMessageRef : null}
                    className={`flex flex-col ${message.role === 'assistant' ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.role === 'assistant'
                        ? 'bg-slate-100 text-slate-900 rounded-tl-none'
                        : 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/20'
                        }`}
                    >
                      <p className="text-[9px] uppercase tracking-wider opacity-60 font-bold mb-1">
                        {message.role === 'assistant' ? 'Copilot' : 'You'}
                      </p>
                      <div className="leading-relaxed assistant-markdown">
                        {message.role === 'assistant' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {assistantLoading && (
                <div className="flex items-start">
                  <div className="bg-slate-100 text-slate-900 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin opacity-60" />
                    <span className="text-xs font-medium opacity-60">Analysing classroom data...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#EDF2F7] bg-white">
              <form onSubmit={handleAssistantSubmit} className="flex flex-row flex-nowrap items-center gap-2">
                <Input
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAssistantSubmit(e as any);
                    }
                  }}
                  placeholder="Ask about learners..."
                  disabled={!selectedCourseId}
                  className="flex-1 border-[#E2E8F0] focus:border-[#2D3748] bg-white text-[#1A202C] placeholder:text-[#A0AEC0] rounded-xl h-11"
                />
                <Button
                  type="submit"
                  disabled={!selectedCourseId || assistantLoading || !assistantInput.trim()}
                  className="bg-[#2D3748] text-white hover:bg-[#1A202C] shadow-sm rounded-xl px-4 h-11 shrink-0 font-bold whitespace-nowrap"
                >
                  {assistantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent className="sm:max-w-[500px] border-slate-200 bg-white">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Email Student</DialogTitle>
              <DialogDescription className="text-slate-600">
                Send a direct message to {emailFormData.fullName}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendEmail} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="to" className="text-slate-700">To</Label>
                <Input
                  id="to"
                  value={Array.isArray(emailFormData.to) ? emailFormData.to.join(', ') : emailFormData.to}
                  disabled
                  className="bg-slate-50 text-xs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject" className="text-slate-700">Subject</Label>
                <Input
                  id="subject"
                  required
                  value={emailFormData.subject}
                  onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })}
                  placeholder="e.g. Feedback on your recent module"
                  className="border-slate-300"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message" className="text-slate-700">Message</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImproveEmail}
                    disabled={!emailFormData.message.trim() || isImprovingEmail}
                    className="text-xs h-7"
                  >
                    {isImprovingEmail ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Improving...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        AI Improve
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="message"
                  required
                  rows={8}
                  value={emailFormData.message}
                  onChange={(e) => setEmailFormData({ ...emailFormData, message: e.target.value })}
                  placeholder="Write your message here..."
                  className="border-slate-300"
                />
                <p className="text-xs text-slate-500">
                  Tip: Write a brief message, then click "AI Improve" to enhance it professionally.
                </p>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="border-slate-300 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={emailSending}
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {emailSending ? 'Sending...' : 'Send Email'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div >
    </SiteLayout >
  );
}

