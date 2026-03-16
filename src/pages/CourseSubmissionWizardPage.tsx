import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { getAuthHeaders, logoutAndRedirect } from "@/utils/session";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Check,
  Upload,
  Plus,
  Trash2,
  Globe,
  Layout,
  Cpu,
  FileText,
  Video,
  Loader2,
  Clock,
  Sparkles,
  Minus,
  Briefcase,
  PlayCircle,
  FolderOpen,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Course Initialization", icon: Globe },
  { id: 2, title: "Choose Mode", icon: Briefcase },
  { id: 3, title: "Course Structure", icon: Layout },
  { id: 4, title: "Review", icon: Check },
];

type NodeType = 'module' | 'topic';

interface CourseNode {
  id: string;
  type: NodeType;
  title: string;
  duration: number;
  tutorNotes?: string;
  hostType?: string;
  deliveryFormat?: string;
  resources?: { name: string; url: string; type: string }[];
  videoLinks?: string[];
  children: CourseNode[];
}

export default function CourseSubmissionWizardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  
  // Tree state for Advanced Mode
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [videoInput, setVideoInput] = useState("");
  const [simpleVideoInput, setSimpleVideoInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    courseName: "",
    category: "Fullstack Development",
    learnerLevel: "Beginner",
    requiresApiKey: false,
    apiKeyEncrypted: "",
    courseObjectives: "",
    submissionMode: "simple",
    // Simple Mode Specific
    moduleCount: 4,
    uploadedDocuments: [] as { name: string; url: string; type: string }[],
    videoLinks: [] as string[],
    // Advanced Mode Specific
    structuredCurriculum: [] as CourseNode[],
    // Pricing
    priceLow: undefined as number | undefined,
    priceHigh: undefined as number | undefined,
  });

  // Fetch existing submissions
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/course-submissions/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/course-submissions/me", undefined, { headers: getAuthHeaders() });
      return res.json();
    },
  });

  const submissions = submissionsData?.submissions ?? [];

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAIGenerate = async () => {
    if (!formData.courseName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a Course Title in Step 1 first.",
      });
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await apiRequest("POST", "/api/ai/generate-curriculum", {
        courseName: formData.courseName,
        learnerLevel: formData.learnerLevel,
        courseObjectives: formData.courseObjectives
      }, { headers: getAuthHeaders() });
      
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      
      updateFormData("structuredCurriculum", data.curriculum);
      toast({
        title: "AI Curriculum Generated!",
        description: "Your course structure has been populated successfully.",
      });
    } catch(err: any) {
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: err.message || "Failed to generate curriculum. Check API keys.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/course-submissions", formData, { headers: getAuthHeaders() });
      if (response.ok) {
        toast({
          title: "Blueprint Submitted!",
          description: "Our content team is now reviewing your course idea.",
        });
        setLocation("/tutors/pending");
      } else {
        throw new Error(await response.text());
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "An error occurred while submitting.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Under Review</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Accepted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderStepIcon = (stepId: number) => {
    if (currentStep > stepId) {
      return <Check className="w-5 h-5 text-white" />;
    }
    return <span className={`text-base font-bold ${currentStep === stepId ? "text-white" : "text-slate-400"}`}>{stepId}</span>;
  };

  // ----- TREE LOGIC (ADVANCED MODE) -----
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const toggleNodeExpansion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addNode = (parentId: string | null, type: NodeType) => {
    const newNode: CourseNode = {
      id: generateId(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      duration: 1,
      children: [],
      ...(type === 'topic' ? {
        tutorNotes: "",
        hostType: "Human",
        deliveryFormat: "Video",
        resources: [],
        videoLinks: []
      } : {})
    };

    if (!parentId) {
      updateFormData("structuredCurriculum", [...formData.structuredCurriculum, newNode]);
    } else {
      const insert = (nodes: CourseNode[]): CourseNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] };
          }
          return { ...node, children: insert(node.children) };
        });
      };
      updateFormData("structuredCurriculum", insert(formData.structuredCurriculum));
      setExpandedNodes(prev => new Set(prev).add(parentId));
    }
    setSelectedNodeId(newNode.id);
  };

  const updateSelectedNode = (updates: Partial<CourseNode>) => {
    if (!selectedNodeId) return;
    const traverse = (nodes: CourseNode[]): CourseNode[] => {
      return nodes.map(node => {
        if (node.id === selectedNodeId) return { ...node, ...updates };
        return { ...node, children: traverse(node.children) };
      });
    };
    updateFormData("structuredCurriculum", traverse(formData.structuredCurriculum));
  };

  const deleteNode = (id: string) => {
    const remove = (nodes: CourseNode[]): CourseNode[] => {
      return nodes.filter(n => n.id !== id).map(n => ({ ...n, children: remove(n.children) }));
    };
    updateFormData("structuredCurriculum", remove(formData.structuredCurriculum));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const getSelectedNode = (): CourseNode | null => {
    const find = (nodes: CourseNode[]): CourseNode | null => {
      for (const node of nodes) {
        if (node.id === selectedNodeId) return node;
        const found = find(node.children);
        if (found) return found;
      }
      return null;
    };
    return find(formData.structuredCurriculum);
  };

  const handleSubTopicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type
    }));
    const node = getSelectedNode();
    if (node) {
      updateSelectedNode({ resources: [...(node.resources || []), ...newFiles] });
    }
  };

  const handleSimpleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type
    }));
    updateFormData("uploadedDocuments", [...formData.uploadedDocuments, ...newFiles]);
  };

  // Calculate totals for review step
  const calculateTotals = () => {
    let topics = 0;
    let resources = formData.uploadedDocuments.length;
    
    if (formData.submissionMode === "advanced") {
      const traverse = (nodes: CourseNode[]) => {
        for (const n of nodes) {
          if (n.type === "topic") {
            topics++;
            resources += (n.resources?.length || 0);
            resources += (n.videoLinks?.length || 0);
          }
          traverse(n.children);
        }
      };
      traverse(formData.structuredCurriculum);
      return { modules: formData.structuredCurriculum.length, topics, resources };
    }
    
    // For simple mode, account for videoLinks as well
    resources += formData.videoLinks.length;
    return { modules: formData.moduleCount, topics: 0, resources };
  };

  // ----- RENDERING -----

  if (submissionsLoading) {
    return (
      <SiteLayout headerProps={{ onLogout: () => logoutAndRedirect("/") }}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  // Dashboard View (List of proposals)
  if (submissions.length > 0 && !isCreatingNew) {
    return (
      <SiteLayout headerProps={{ onLogout: () => logoutAndRedirect("/") }}>
        <div className="min-h-screen bg-slate-50/50 py-12 px-4 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setLocation("/tutors")}
              className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors p-0 hover:bg-transparent -ml-1 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
              <div>
                <h1 className="text-[40px] font-black tracking-tight text-slate-900 leading-tight">My Proposals</h1>
                <p className="text-lg text-slate-500 mt-1">Track and manage your submitted course ideas.</p>
              </div>
              <Button
                onClick={() => setIsCreatingNew(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 flex items-center gap-2 h-14 shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Create Another Course
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {submissions.map((sub: any) => {
                const isExpanded = expandedSubmissionId === sub.submissionId;
                return (
                <Card 
                  key={sub.submissionId} 
                  className="border-none shadow-xl bg-white/80 backdrop-blur-md hover:shadow-2xl transition-all duration-300 overflow-hidden group rounded-[24px] cursor-pointer"
                  onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.submissionId)}
                >
                  <div className="h-2 w-full bg-slate-100 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-indigo-500 transition-all duration-500" />
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-primary transition-colors">{sub.courseName}</h3>
                        <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg">
                            <Briefcase className="w-4 h-4 text-slate-400" /> 
                            {sub.submissionMode === 'advanced' ? 'Advanced Tree' : 'Simple Mode'}
                          </span>
                          <span className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg"><Globe className="w-4 h-4 text-slate-400" /> {sub.category}</span>
                          <span className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4 text-slate-400" /> {new Date(sub.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-2 bg-indigo-50/50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100/50">
                            <Sparkles className="w-4 h-4 text-indigo-400" /> 
                            ₹{sub.priceLow} - ₹{sub.priceHigh}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="scale-110">{renderStatusBadge(sub.status)}</div>
                        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-8 pt-8 border-t border-slate-100"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Target Audience</h4>
                              <p className="font-semibold text-slate-800">{sub.learnerLevel}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Course Objectives</h4>
                              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                                {sub.courseObjectives || 'No objectives provided.'}
                              </p>
                            </div>
                            {sub.requiresApiKey && (
                              <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">API Requirements</h4>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">Requires Custom API Key</Badge>
                              </div>
                            )}
                          </div>
                          {sub.submissionMode === 'simple' ? (
                              <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                  <Layout className="w-24 h-24" />
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Submission Summary</h4>
                                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 relative z-10">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-indigo-50 rounded-lg">
                                        <Layout className="w-5 h-5 text-indigo-500" />
                                      </div>
                                      <span className="text-slate-600 font-bold uppercase text-xs tracking-wider">Modules Requested</span>
                                    </div>
                                    <span className="font-black text-slate-900 text-xl">{sub.moduleCount}</span>
                                  </div>
                                </div>

                                {sub.uploadedDocuments && Array.isArray(sub.uploadedDocuments) && sub.uploadedDocuments.length > 0 && (
                                  <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reference Documents</h5>
                                    <div className="grid grid-cols-1 gap-2 relative z-10">
                                      {sub.uploadedDocuments.map((doc: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:border-indigo-200 transition-colors shadow-sm">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm font-bold text-slate-700 truncate">{doc?.name || 'Document'}</span>
                                          </div>
                                          {doc?.url && (
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-indigo-500">
                                              <ExternalLink className="w-4 h-4" />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {sub.videoLinks && Array.isArray(sub.videoLinks) && sub.videoLinks.length > 0 && (
                                  <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Video References</h5>
                                    <div className="grid grid-cols-1 gap-2 relative z-10">
                                      {sub.videoLinks.map((link: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                          <div className="p-1.5 bg-red-50 rounded-lg">
                                            <Video className="w-3.5 h-3.5 text-red-500" />
                                          </div>
                                          <a href={link} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 truncate hover:underline">
                                            {link}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Curriculum Blueprint</h5>
                                  <Badge className="bg-indigo-600 text-white border-none text-[10px] px-3 py-1 font-black">{(sub.structuredCurriculum || []).length} MODULES</Badge>
                                </div>
                                <div className="space-y-5 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                                  {(sub.structuredCurriculum || []).map((module: any, mIdx: number) => (
                                    <div key={module.id || mIdx} className="space-y-4">
                                      <div className="flex items-center gap-3 py-3 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100">
                                          {mIdx + 1}
                                        </div>
                                        <div className="font-black text-slate-900 text-base">{module.title}</div>
                                      </div>
                                      <div className="ml-5 pl-5 border-l-2 border-indigo-50 space-y-4">
                                        {module.children?.map((topic: any, tIdx: number) => (
                                          <div key={topic.id || tIdx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
                                            <div className="flex justify-between items-start gap-4">
                                              <div className="font-bold text-slate-800 text-lg">{topic.title}</div>
                                              <Badge variant="outline" className="text-[10px] h-6 bg-slate-50 border-slate-200 whitespace-nowrap px-2 font-bold text-slate-500">
                                                <Clock className="w-3 h-3 mr-1.5" /> {topic.duration} HRS
                                              </Badge>
                                            </div>
                                            
                                            {topic.tutorNotes && (
                                              <p className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-xl italic">
                                                {topic.tutorNotes}
                                              </p>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                              {topic.deliveryFormat && <span className="bg-blue-50 text-blue-700 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border border-blue-100/50">{topic.deliveryFormat}</span>}
                                              {topic.hostType && <span className="bg-purple-50 text-purple-700 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border border-purple-100/50">{topic.hostType}</span>}
                                            </div>

                                            {(topic.resources?.length > 0 || topic.videoLinks?.length > 0) && (
                                              <div className="pt-4 border-t border-slate-50 space-y-3">
                                                {topic.resources?.map((res: any, rIdx: number) => (
                                                  <div key={rIdx} className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50/50 p-2 rounded-lg">
                                                    <div className="p-1 bg-white rounded-md shadow-sm">
                                                      <FileText className="w-3 h-3 text-indigo-400" />
                                                    </div>
                                                    <span className="truncate">{res.name}</span>
                                                  </div>
                                                ))}
                                                {topic.videoLinks?.map((vlink: string, vIdx: number) => (
                                                  <div key={vIdx} className="flex items-center gap-3 text-xs font-semibold text-indigo-600 bg-indigo-50/30 p-2 rounded-lg group/link">
                                                    <div className="p-1 bg-white rounded-md shadow-sm">
                                                      <PlayCircle className="w-3 h-3 text-red-500" />
                                                    </div>
                                                    <span className="truncate group-hover/link:underline cursor-pointer">{vlink}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="bg-slate-900 rounded-[32px] p-10 text-white col-span-1 md:col-span-2 shadow-2xl relative overflow-hidden border border-slate-800">
                               <div className="absolute top-0 right-0 p-12 opacity-10">
                                 <Sparkles className="w-48 h-48" />
                               </div>
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Business Strategy & Commercials</h4>
                               <div className="flex flex-wrap items-center gap-16 relative z-10">
                                  <div>
                                     <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Lowest Target Price</p>
                                     <p className="text-5xl font-black text-white flex items-baseline gap-2">
                                        <span className="text-2xl text-primary font-medium">₹</span>{sub.priceLow || '0'}
                                     </p>
                                  </div>
                                  <div className="h-20 w-px bg-slate-800 hidden lg:block" />
                                  <div>
                                     <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Highest Target Price</p>
                                     <p className="text-5xl font-black text-white flex items-baseline gap-2">
                                        <span className="text-2xl text-primary font-medium">₹</span>{sub.priceHigh || '0'}
                                     </p>
                                  </div>
                                  <div className="ml-auto flex items-center gap-2 bg-white/5 px-6 py-4 rounded-3xl border border-white/5 backdrop-blur-sm">
                                     <div className="p-2 bg-indigo-500 rounded-xl">
                                        <ShieldCheck className="w-5 h-5 text-white" />
                                     </div>
                                     <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Content Rights</p>
                                        <p className="text-sm font-bold">Retained by Tutor</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="mt-16 p-10 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-[32px] border border-blue-100/50 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                <Sparkles className="w-32 h-32" />
              </div>
              <div className="p-5 bg-white rounded-3xl shadow-xl shadow-blue-500/10">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-xl text-slate-900 mb-2">Platform Engine Is Processing</h4>
                <p className="text-slate-600 leading-relaxed text-lg max-w-2xl">
                  Our curriculum designer team is currently reviewing your drafts. You'll be notified once accepted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // Wizard View
  const selectedNode = getSelectedNode();
  const totals = calculateTotals();

  return (
    <SiteLayout headerProps={{ onLogout: () => logoutAndRedirect("/") }}>
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto mb-12">
          <Button
            variant="ghost"
            onClick={() => setLocation("/tutors")}
            className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors p-0 hover:bg-transparent -ml-1 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Button>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              Course Submission Wizard
            </h1>
            <p className="text-lg text-slate-600">
              Complete the Blueprint to propose your curriculum.
            </p>
          </div>

          <div className="relative flex justify-between items-center px-4 max-w-4xl mx-auto mb-12">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            {STEPS.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${currentStep === step.id
                    ? "bg-slate-900 border-slate-900 shadow-lg scale-110"
                    : currentStep > step.id
                      ? "bg-primary border-primary"
                      : "bg-white border-slate-200"
                    }`}
                >
                  {renderStepIcon(step.id)}
                </div>
                <span className={`text-xs mt-2 font-medium hidden sm:block ${currentStep === step.id ? "text-slate-900" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100 overflow-hidden bg-white rounded-xl">
                {currentStep !== 1 && (
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      {STEPS[currentStep - 1].title}
                    </CardTitle>
                  </CardHeader>
                )}

                <CardContent className="p-8">
                  {/* STEP 1: METADATA */}
                  {currentStep === 1 && (
                    <div className="max-w-4xl mx-auto">
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">Course Initialization</h2>
                      <p className="text-slate-500 mb-8 text-sm text-slate-400">Fill in the basic details for your new course blueprint.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Left Column: Core Details */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-2 mb-2">
                             <div className="w-1 h-5 bg-slate-800 rounded-full"></div>
                             <h3 className="text-base font-bold text-slate-800">Core Details</h3>
                           </div>
                           
                           <div className="space-y-1.5">
                             <Label htmlFor="courseName" className="text-sm font-bold text-slate-800">Course Title*</Label>
                             <p className="text-xs text-slate-400">Give your course a clear, descriptive name.</p>
                             <Input
                               id="courseName"
                               placeholder="Science"
                               value={formData.courseName}
                               onChange={(e) => updateFormData("courseName", e.target.value)}
                               className="h-10 border-slate-200 rounded-lg text-sm"
                             />
                           </div>
                           
                           <div className="space-y-1.5">
                             <Label htmlFor="category" className="text-sm font-bold text-slate-800">Category</Label>
                             <p className="text-xs text-slate-400">Choose the subject area for your course.</p>
                             <div className="space-y-3">
                               <Select value={formData.category} onValueChange={(val) => updateFormData("category", val)}>
                                 <SelectTrigger className="h-10 border-slate-200 rounded-lg text-sm">
                                   <SelectValue placeholder="Select a category" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="Fullstack Development">Fullstack Development</SelectItem>
                                   <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                                   <SelectItem value="Data Science">Data Science</SelectItem>
                                   <SelectItem value="Science">Science</SelectItem>
                                   <SelectItem value="Mathematics">Mathematics</SelectItem>
                                   <SelectItem value="Engineering">Engineering</SelectItem>
                                   <SelectItem value="Design">Design</SelectItem>
                                   <SelectItem value="Business">Business</SelectItem>
                                   <SelectItem value="Marketing">Marketing</SelectItem>
                                   <SelectItem value="Others">Others</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>

                           <div className="space-y-1.5">
                             <Label className="text-sm font-bold text-slate-800">Learner Level</Label>
                             <p className="text-xs text-slate-400">Who is this course designed for?</p>
                             <div className="flex gap-3">
                               {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                                 <Button
                                   key={lvl}
                                   variant="outline"
                                   onClick={() => updateFormData("learnerLevel", lvl)}
                                   className={cn(
                                      "h-9 flex-1 rounded-full border-slate-200 text-slate-600 bg-white justify-start pl-3 gap-2 font-normal text-xs transition-all",
                                      formData.learnerLevel === lvl ? "border-slate-800 ring-1 ring-slate-800 bg-slate-50 font-medium" : "hover:bg-slate-50"
                                   )}
                                 >
                                   <div className={cn(
                                      "w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center transition-colors",
                                      formData.learnerLevel === lvl ? "border-slate-800" : ""
                                   )}>
                                     {formData.learnerLevel === lvl && <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />}
                                   </div>
                                   {lvl}
                                 </Button>
                               ))}
                             </div>
                           </div>

                           <div className="space-y-1.5">
                             <Label className="text-sm font-bold text-slate-800">API Key</Label>
                             <p className="text-xs text-slate-400">Does this course require a third-party API key?</p>
                             <div className="flex gap-3">
                               <Button
                                 variant="outline"
                                 onClick={() => updateFormData("requiresApiKey", true)}
                                 className={cn(
                                      "h-9 w-20 rounded-full border-slate-200 text-slate-600 bg-white justify-start pl-3 gap-2 font-normal text-xs transition-all",
                                      formData.requiresApiKey === true ? "border-slate-800 ring-1 ring-slate-800 bg-slate-50 font-medium" : "hover:bg-slate-50"
                                 )}
                               >
                                 <div className={cn(
                                      "w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center transition-colors",
                                      formData.requiresApiKey === true ? "border-slate-800" : ""
                                 )}>
                                     {formData.requiresApiKey === true && <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />}
                                 </div>
                                 Yes
                               </Button>
                               <Button
                                 variant="outline"
                                 onClick={() => updateFormData("requiresApiKey", false)}
                                 className={cn(
                                      "h-9 w-20 rounded-full border-slate-200 text-slate-600 bg-white justify-start pl-3 gap-2 font-normal text-xs transition-all",
                                      formData.requiresApiKey === false ? "border-slate-800 ring-1 ring-slate-800 bg-slate-50 font-medium" : "hover:bg-slate-50"
                                 )}
                               >
                                 <div className={cn(
                                      "w-3 h-3 rounded-full border border-slate-300 flex items-center justify-center transition-colors",
                                      formData.requiresApiKey === false ? "border-slate-800" : ""
                                 )}>
                                     {formData.requiresApiKey === false && <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />}
                                 </div>
                                 No
                               </Button>
                             </div>
                             
                             {formData.requiresApiKey && (
                               <motion.div 
                                 initial={{ opacity: 0, height: 0 }} 
                                 animate={{ opacity: 1, height: "auto" }} 
                                 className="pt-3"
                               >
                                 <Label htmlFor="apiKeyEncrypted" className="text-sm font-bold text-slate-800 mb-1.5 block">API Key Value</Label>
                                 <p className="text-xs text-slate-400 mb-2">Paste your third-party API key here. It will be encrypted.</p>
                                 <Input
                                   id="apiKeyEncrypted"
                                   type="password"
                                   placeholder="sk-..."
                                   value={formData.apiKeyEncrypted}
                                   onChange={(e) => updateFormData("apiKeyEncrypted", e.target.value)}
                                   className="h-10 border-slate-200 rounded-lg text-sm bg-white"
                                 />
                               </motion.div>
                             )}
                           </div>
                        </div>

                        {/* Right Column: Course Objectives */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-2 mb-2">
                             <div className="w-1 h-5 bg-teal-400 rounded-full"></div>
                             <h3 className="text-base font-bold text-slate-800">Course Objectives</h3>
                           </div>
                           
                           <div className="space-y-1.5">
                             <p className="text-xs text-slate-400">Describe what learners will achieve after completing this course.</p>
                             <Textarea
                               id="courseObjectives"
                               placeholder="e.g. By the end of this course, learners will be able to&#10;1. Understand core ML concepts&#10;2. Build basic models..."
                               rows={8}
                               value={formData.courseObjectives}
                               onChange={(e) => updateFormData("courseObjectives", e.target.value)}
                               className="resize-none border-slate-200 rounded-lg text-sm"
                             />
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CHOOSE MODE */}
                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-8">
                      <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateFormData("submissionMode", "simple")}
                        className={cn(
                          "cursor-pointer border-2 rounded-3xl p-8 hover:shadow-2xl transition-all relative overflow-hidden group",
                          formData.submissionMode === "simple" ? "border-blue-600 bg-blue-50/30" : "border-slate-200 bg-white"
                        )}
                      >
                        {formData.submissionMode === "simple" && (
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="absolute top-4 right-4 bg-blue-600 text-white p-1 rounded-full shadow-lg"
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        )}
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                          formData.submissionMode === "simple" ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                        )}>
                          <Upload className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-slate-900">Simple Mode</h3>
                        <p className="text-slate-600 leading-relaxed min-h-[80px]">
                          <strong className="text-slate-800">We will help you in designing the course curriculum.</strong> Hand off your raw materials to our expert content-creation team. This is a premium paid service, but you maintain full rights to your content.
                        </p>
                        
                        {/* Animated overlay to convey the message visually on hover */}
                        <div className="mt-6 flex flex-col gap-2 bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden transition-all duration-300 opacity-0 h-0 group-hover:opacity-100 group-hover:h-[80px]">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
                          <div className="flex items-center gap-3">
                            <motion.div 
                              animate={{ rotate: [0, -10, 10, -10, 10, 0] }} 
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                            >
                              <Briefcase className="text-blue-500 w-5 h-5" />
                            </motion.div>
                            <p className="text-sm font-bold text-blue-900">Content-Creation Service</p>
                          </div>
                          <p className="text-xs font-medium text-slate-500 ml-8 flex items-center gap-1">
                             <ShieldCheck className="w-3 h-3 text-green-500"/> You retain 100% content rights
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateFormData("submissionMode", "advanced")}
                        className={cn(
                          "cursor-pointer border-2 rounded-3xl p-8 hover:shadow-2xl transition-all relative overflow-hidden group",
                          formData.submissionMode === "advanced" ? "border-indigo-600 bg-indigo-50/30" : "border-slate-200 bg-white"
                        )}
                      >
                        {formData.submissionMode === "advanced" && (
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="absolute top-4 right-4 bg-indigo-600 text-white p-1 rounded-full shadow-lg"
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        )}
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                          formData.submissionMode === "advanced" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200"
                        )}>
                          <Layout className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-slate-900">Advanced Mode</h3>
                        <p className="text-slate-600 leading-relaxed min-h-[80px]">
                          <strong className="text-slate-800">Design your own curriculum powered by Market-Intelligence.</strong> Manually build out your hierarchy using our dynamic tree editor, accelerated by AI that suggests booming job-market skills.
                        </p>

                        {/* Animated overlay to convey the message visually on hover */}
                        <div className="mt-6 flex flex-col gap-2 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden transition-all duration-300 opacity-0 h-0 group-hover:opacity-100 group-hover:h-[80px]">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                          <div className="flex items-center gap-3">
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }} 
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles className="text-indigo-500 w-5 h-5" />
                            </motion.div>
                            <p className="text-sm font-bold text-indigo-900">AI-Powered Driver's Seat</p>
                          </div>
                          <p className="text-xs font-medium text-slate-500 ml-8 flex items-center gap-1">
                             <Cpu className="w-3 h-3 text-indigo-400"/> Live job-market aware curriculum engine
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* STEP 3: STRUCTURE */}
                  {currentStep === 3 && (
                    <div>
                      {formData.submissionMode === "simple" ? (
                        <div className="space-y-8 max-w-3xl mx-auto py-8">
                          <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
                            <h3 className="text-xl font-bold mb-2">Auto-Generate Structure</h3>
                            <p className="text-slate-500 mb-6">How many modules do you need for this course?</p>
                            
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                onClick={() => updateFormData("moduleCount", Math.max(1, formData.moduleCount - 1))}
                                className="h-14 w-14 rounded-xl shadow-sm text-xl"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={formData.moduleCount}
                                onChange={(e) => updateFormData("moduleCount", parseInt(e.target.value) || 1)}
                                className="h-14 w-32 text-center text-3xl font-bold bg-white"
                              />
                              <Button
                                variant="outline"
                                onClick={() => updateFormData("moduleCount", formData.moduleCount + 1)}
                                className="h-14 w-14 rounded-xl shadow-sm text-xl"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          <div className="border border-slate-200 rounded-2xl p-8 bg-white">
                            <div className="flex justify-between items-center mb-6">
                              <div>
                                <h3 className="text-xl font-bold">Bulk Material Upload</h3>
                                <p className="text-slate-500 text-sm">Attach all related PDFs, slide decks, and zips.</p>
                              </div>
                              <Button variant="outline" onClick={() => document.getElementById("simple-bulk")?.click()}>
                                <Upload className="w-4 h-4 mr-2" /> Upload Files
                              </Button>
                              <input id="simple-bulk" type="file" multiple hidden onChange={handleSimpleFileChange} />
                            </div>

                            {formData.uploadedDocuments.length > 0 ? (
                              <div className="space-y-3">
                                {formData.uploadedDocuments.map((doc, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                      <FileText className="text-primary w-5 h-5"/>
                                      <span className="font-medium">{doc.name}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => updateFormData("uploadedDocuments", formData.uploadedDocuments.filter((_, idx) => idx !== i))}>
                                      <Trash2 className="text-red-500 w-4 h-4"/>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-slate-400">No files uploaded yet.</p>
                              </div>
                            )}
                          </div>

                          <div className="border border-slate-200 rounded-2xl p-8 bg-white">
                            <div className="flex justify-between items-center mb-6">
                              <div>
                                <h3 className="text-xl font-bold">Video Links</h3>
                                <p className="text-slate-500 text-sm">Attach external URLs for your course context (e.g. Youtube, Vimeo).</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mb-6">
                              <Input 
                                placeholder="https://youtube.com/..." 
                                value={simpleVideoInput} 
                                onChange={e => setSimpleVideoInput(e.target.value)} 
                                onKeyDown={(e) => {
                                  if(e.key === 'Enter' && simpleVideoInput) {
                                    updateFormData("videoLinks", [...formData.videoLinks, simpleVideoInput]);
                                    setSimpleVideoInput("");
                                  }
                                }}
                                className="h-12 bg-slate-50 border-slate-200"
                              />
                              <Button 
                                onClick={() => {
                                  if(simpleVideoInput) {
                                    updateFormData("videoLinks", [...formData.videoLinks, simpleVideoInput]);
                                    setSimpleVideoInput("");
                                  }
                                }}
                                className="h-12 px-6"
                              >
                                Add URL
                              </Button>
                            </div>

                            {formData.videoLinks.length > 0 ? (
                              <div className="space-y-3">
                                {formData.videoLinks.map((url, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <Video className="text-primary w-5 h-5 flex-shrink-0"/>
                                      <span className="font-medium truncate text-blue-600 max-w-sm">{url}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => updateFormData("videoLinks", formData.videoLinks.filter((_, idx) => idx !== i))}>
                                      <Trash2 className="text-red-500 w-4 h-4"/>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-slate-400">No video links added yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // ADVANCED MODE - TREE AND EDITOR
                        <div className="flex flex-col lg:flex-row gap-6 -mx-4 h-[600px]">
                          {/* Tree View Left */}
                          <div className="w-full lg:w-1/3 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-slate-700">Curriculum Tree</h3>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleAIGenerate} disabled={isGeneratingAI} className="h-8 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-700">
                                  {isGeneratingAI ? <Loader2 className="w-3 h-3 mr-1 animate-spin"/> : <Sparkles className="w-3 h-3 mr-1"/>}
                                  AI Generate
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => addNode(null, 'module')} className="h-8 rounded-lg text-xs">
                                  <Plus className="w-3 h-3 mr-1"/> Module
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {formData.structuredCurriculum.length === 0 && !isGeneratingAI && (
                                <div className="text-center py-10 px-4 bg-white rounded-xl border border-dashed border-slate-200">
                                  <Cpu className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
                                  <p className="text-sm font-medium text-slate-600 mb-1">Empty Curriculum</p>
                                  <p className="text-xs text-slate-400 mb-4">You can manually add a module or use AI to instantly build a skeleton.</p>
                                  <Button size="sm" onClick={handleAIGenerate} disabled={isGeneratingAI} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200 w-full">
                                    <Sparkles className="w-3 h-3 mr-2" /> Auto-Generate via AI
                                  </Button>
                                </div>
                              )}
                              {isGeneratingAI && (
                                <div className="text-center py-12 px-4">
                                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="inline-block">
                                    <Sparkles className="w-8 h-8 text-indigo-500 mb-4 mx-auto" />
                                  </motion.div>
                                  <p className="text-sm font-bold text-slate-700 animate-pulse">AI is searching for latest job-market trends...</p>
                                  <p className="text-xs text-slate-400 mt-2">Fetching blooming skills and latest tech pillars</p>
                                </div>
                              )}
                              
                              {formData.structuredCurriculum.map(node => {
                                const renderNode = (n: CourseNode, depth: number) => {
                                  const isExpanded = expandedNodes.has(n.id);
                                  const isSelected = selectedNodeId === n.id;
                                  
                                  return (
                                    <div key={n.id} className="w-full">
                                      <div 
                                        className={cn(
                                          "flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors group",
                                          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-slate-200/50"
                                        )}
                                        style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
                                        onClick={() => setSelectedNodeId(n.id)}
                                      >
                                        <div onClick={(e) => n.children.length > 0 && toggleNodeExpansion(e, n.id)} className="w-4 flex justify-center text-slate-400">
                                          {n.children.length > 0 ? (
                                             isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                          ) : <span className="w-4"/>}
                                        </div>
                                        
                                        {n.type === 'module' && <FolderOpen className="w-4 h-4 shrink-0" />}
                                        {n.type === 'topic' && <Layout className="w-4 h-4 shrink-0" />}

                                        
                                        <span className="truncate flex-1 text-sm">{n.title}</span>
                                        
                                        {/* Hover Actions */}
                                        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                                          {n.type === 'module' && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); addNode(n.id, 'topic'); }}>
                                              <Plus className="w-3 h-3" />
                                            </Button>
                                          )}
                                          {n.type === 'topic' && (
                                            <div className="w-6 h-6" /> // Placeholder to maintain spacing
                                          )}
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={(e) => { e.stopPropagation(); deleteNode(n.id); }}>
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {isExpanded && n.children.length > 0 && (
                                        <div className="flex flex-col">
                                          {n.children.map(child => renderNode(child, depth + 1))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                };
                                return renderNode(node, 0);
                              })}
                            </div>
                          </div>

                          {/* Editor Right */}
                          <div className="w-full lg:w-2/3 bg-white border border-slate-200 rounded-2xl p-6 overflow-y-auto shadow-inner">
                            {selectedNode ? (
                              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                  <Badge className="uppercase tracking-widest bg-slate-900">{selectedNode.type}</Badge>
                                  <span className="text-slate-400 text-sm">ID: {selectedNode.id}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="col-span-2 space-y-2">
                                    <Label>Title</Label>
                                    <Input value={selectedNode.title} onChange={e => updateSelectedNode({ title: e.target.value })} />
                                  </div>
                                  <div className="col-span-2 md:col-span-1 space-y-2">
                                    <Label>Duration (Hours)</Label>
                                    <Input type="number" step="0.5" value={selectedNode.duration} onChange={e => updateSelectedNode({ duration: parseFloat(e.target.value) || 0 })} />
                                  </div>
                                </div>

                                {selectedNode.type === 'topic' && (
                                  <>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                      <div className="space-y-2">
                                        <Label>Host Type</Label>
                                        <Select value={selectedNode.hostType} onValueChange={v => updateSelectedNode({ hostType: v })}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Human">Human Host</SelectItem>
                                            <SelectItem value="AI Narrator">AI Narrator</SelectItem>
                                            <SelectItem value="No Voice">No Voice (Text/Slides)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Delivery Format</Label>
                                        <Select value={selectedNode.deliveryFormat} onValueChange={v => updateSelectedNode({ deliveryFormat: v })}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Video">Video</SelectItem>
                                            <SelectItem value="Slides">Slides</SelectItem>
                                            <SelectItem value="Text">Text Article</SelectItem>
                                            <SelectItem value="PDF">PDF Only</SelectItem>
                                            <SelectItem value="Live Session">Live Session</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Tutor Notes</Label>
                                      <Textarea 
                                        rows={3} 
                                        placeholder="Specific instructions for content team..." 
                                        value={selectedNode.tutorNotes} 
                                        onChange={e => updateSelectedNode({ tutorNotes: e.target.value })}
                                      />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                      <h4 className="font-bold flex items-center gap-2"><Video className="w-4 h-4 text-red-500"/> External Videos</h4>
                                      <div className="flex gap-2">
                                        <Input placeholder="youtube link..." value={videoInput} onChange={e => setVideoInput(e.target.value)} onKeyDown={(e) => {
                                          if(e.key === 'Enter' && videoInput) {
                                            updateSelectedNode({ videoLinks: [...(selectedNode.videoLinks||[]), videoInput]});
                                            setVideoInput("");
                                          }
                                        }}/>
                                        <Button onClick={() => {
                                            if(videoInput) {
                                              updateSelectedNode({ videoLinks: [...(selectedNode.videoLinks||[]), videoInput]});
                                              setVideoInput("");
                                            }
                                        }}>Add</Button>
                                      </div>
                                      {selectedNode.videoLinks?.map((vl, i) => (
                                        <div key={i} className="flex justify-between p-2 bg-slate-50 border rounded text-sm items-center">
                                          <span className="truncate mr-4 text-blue-600">{vl}</span>
                                          <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => updateSelectedNode({ videoLinks: selectedNode.videoLinks?.filter((_, idx)=>idx!==i) })}/>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                      <div className="flex justify-between items-center">
                                        <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500"/> Local Resources</h4>
                                        <Button size="sm" variant="outline" onClick={() => document.getElementById('node-file-upload')?.click()}>Upload File</Button>
                                        <input type="file" id="node-file-upload" multiple hidden onChange={handleSubTopicFileChange}/>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        {selectedNode.resources?.map((res, i) => (
                                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 border rounded-lg group">
                                            <span className="truncate text-sm font-medium pr-2" title={res.name}>{res.name}</span>
                                            <Trash2 onClick={() => updateSelectedNode({ resources: selectedNode.resources?.filter((_, idx)=>idx!==i) })} className="w-4 h-4 text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                <Layout className="w-12 h-12 opacity-20" />
                                <p>Select a node in the tree to edit its properties.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4: REVIEW */}
                  {currentStep === 4 && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                          <p className="text-slate-500 text-sm uppercase font-bold mb-1">Modules</p>
                          <p className="text-4xl font-black text-slate-900">{totals.modules}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                          <p className="text-slate-500 text-sm uppercase font-bold mb-1">Topics</p>
                          <p className="text-4xl font-black text-slate-900">{formData.submissionMode==='advanced' ? totals.topics : 'Auto'}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                          <p className="text-slate-500 text-sm uppercase font-bold mb-1">Resources</p>
                          <p className="text-4xl font-black text-slate-900">{totals.resources}</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                          <Check className="w-5 h-5 text-indigo-500"/> Pricing Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <Label className="text-slate-600 font-bold">Lowest Intended Selling Price (₹)</Label>
                            <Input 
                              type="number" 
                              placeholder="e.g. 499" 
                              className="h-12 text-lg border-slate-200 focus:ring-indigo-500"
                              value={formData.priceLow ?? ""} 
                              onChange={e => updateFormData("priceLow", parseFloat(e.target.value) || undefined)} 
                            />
                            <p className="text-xs text-slate-400">The minimum price you're willing to accept.</p>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-slate-600 font-bold">Highest Intended Selling Price (₹)</Label>
                            <Input 
                              type="number" 
                              placeholder="e.g. 1999" 
                              className="h-12 text-lg border-slate-200 focus:ring-indigo-500"
                              value={formData.priceHigh ?? ""} 
                              onChange={e => updateFormData("priceHigh", parseFloat(e.target.value) || undefined)} 
                            />
                            <p className="text-xs text-slate-400">The standard/premium price for the course content.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150">
                          <Globe className="w-32 h-32" />
                        </div>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                          <Briefcase className="w-6 h-6 text-primary"/> Blueprint Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8 relative z-10">
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Course Title</p>
                            <p className="text-lg font-semibold">{formData.courseName || "Untitled Course"}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Category & Level</p>
                            <p className="text-lg font-semibold">{formData.category} • {formData.learnerLevel}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Workflow Mode</p>
                            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest">{formData.submissionMode}</Badge>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">API Integration</p>
                            {formData.requiresApiKey ? <Badge className="bg-amber-500/20 text-amber-300">Required</Badge> : <span className="text-slate-300">Not required</span>}
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Primary Objective</p>
                            <p className="text-sm font-medium text-slate-300 line-clamp-2 italic">"{formData.courseObjectives || "Not provided."}"</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Target Price Range</p>
                            <p className="text-lg font-bold text-indigo-400">₹{formData.priceLow || '0'} — ₹{formData.priceHigh || '0'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-white border-t border-slate-100 p-6 flex justify-between items-center rounded-b-xl">
                  <div className="text-sm font-medium text-slate-400">
                     Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].title}
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/tutors/pending")}
                      disabled={isSubmitting}
                      className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-10 px-6 rounded-lg"
                    >
                      Save Draft
                    </Button>

                    {currentStep === STEPS.length ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-8 rounded-lg"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Submit
                      </Button>
                    ) : (
                      <Button
                        onClick={nextStep}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-8 rounded-lg"
                      >
                        Save & Next
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SiteLayout>
  );
}
