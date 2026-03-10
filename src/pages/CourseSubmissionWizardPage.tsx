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
  DollarSign,
  Cpu,
  FileText,
  Video,
  Loader2,
  Clock,
  Sparkles,
  IndianRupee,
  Minus
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Course Info", icon: Globe },
  { id: 2, title: "Structure", icon: Layout },
  { id: 3, title: "Pricing", icon: DollarSign },
  { id: 4, title: "AI Setup", icon: Cpu },
  { id: 5, title: "Materials", icon: FileText },
  { id: 6, title: "Videos", icon: Video },
  { id: 7, title: "Review", icon: Check },
];

export default function CourseSubmissionWizardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    courseName: "",
    description: "",
    targetAudience: "",
    category: "Fullstack Development",
    moduleCount: 4,
    priceHigh: 0,
    priceLow: 0,
    discountPercent: 0,
    apiKeyProvider: "openai",
    apiKeyHint: "",
    apiKeyEncrypted: "",
    uploadedDocuments: [] as { name: string; url: string; type: string }[],
    videoLinks: [] as string[],
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

  const handleAddVideo = () => {
    const val = videoInput.trim();
    if (val) {
      updateFormData("videoLinks", [...formData.videoLinks, val]);
      setVideoInput("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type
    }));

    updateFormData("uploadedDocuments", [...formData.uploadedDocuments, ...newFiles]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/course-submissions", formData, { headers: getAuthHeaders() });
      if (response.ok) {
        toast({
          title: "Submission Successful!",
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
      case 'draft_ready':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Draft Ready</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderStepIcon = (stepId: number) => {
    const step = STEPS.find(s => s.id === stepId);
    if (!step) return null;
    const Icon = step.icon;

    if (currentStep > stepId) {
      return <Check className="w-5 h-5 text-white" />;
    }
    return <Icon className={`w-5 h-5 ${currentStep === stepId ? "text-white" : "text-muted-foreground"}`} />;
  };

  if (submissionsLoading) {
    return (
      <SiteLayout headerProps={{ onLogout: () => logoutAndRedirect("/") }}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  // List View (Existing Submissions)
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
              {submissions.map((sub: any) => (
                <Card key={sub.submissionId} className="border-none shadow-xl bg-white/80 backdrop-blur-md hover:shadow-2xl transition-all duration-300 overflow-hidden group rounded-[24px]">
                  <div className="h-2 w-full bg-slate-100 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-indigo-500 transition-all duration-500" />
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-primary transition-colors">{sub.courseName}</h3>
                        <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg"><Layout className="w-4 h-4 text-slate-400" /> {sub.moduleCount} Modules</span>
                          <span className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg"><Globe className="w-4 h-4 text-slate-400" /> {sub.category}</span>
                          <span className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4 text-slate-400" /> {new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="scale-110">{renderStatusBadge(sub.status)}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedSubmissionId(expandedSubmissionId === sub.submissionId ? null : sub.submissionId)}
                          className={cn(
                            "text-slate-300 group-hover:text-primary transition-all rounded-full",
                            expandedSubmissionId === sub.submissionId && "bg-primary/10 text-primary rotate-180"
                          )}
                        >
                          <ChevronDown className="w-8 h-8" />
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedSubmissionId === sub.submissionId && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Pricing Strategy</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-500 mb-1">Standard Price</p>
                                    <p className="text-xl font-bold text-slate-900 flex items-center gap-1">
                                      <IndianRupee className="w-4 h-4" />
                                      {sub.priceHigh.toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-xs text-slate-500 mb-1">Flash Sale</p>
                                    <p className="text-xl font-bold text-slate-900 flex items-center gap-1">
                                      <IndianRupee className="w-4 h-4" />
                                      {sub.priceLow.toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4 bg-primary/5 p-4 rounded-2xl flex justify-between items-center">
                                  <span className="text-sm font-medium text-primary">Default Discount</span>
                                  <span className="text-lg font-bold text-primary">{sub.discountPercent}%</span>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">AI Configuration</h4>
                                <div className="bg-slate-900 p-5 rounded-2xl text-white flex items-center gap-4">
                                  <div className="p-3 bg-white/10 rounded-xl">
                                    <Cpu className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400">Preferred Provider</p>
                                    <p className="font-bold capitalize">{sub.apiKeyProvider || 'Not Specified'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Course Assets</h4>
                                <div className="space-y-3">
                                  {sub.uploadedDocuments && sub.uploadedDocuments.length > 0 ? (
                                    sub.uploadedDocuments.map((doc: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group/doc border border-transparent hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-3">
                                          <FileText className="w-4 h-4 text-primary" />
                                          <span className="text-sm font-medium truncate max-w-[200px]">{doc.name}</span>
                                        </div>
                                        <a
                                          href={doc.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-bold text-primary opacity-0 group-hover/doc:opacity-100 transition-opacity px-3 py-1 bg-white rounded-lg shadow-sm"
                                        >
                                          View
                                        </a>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No documents uploaded</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Video References</h4>
                                <div className="space-y-3">
                                  {sub.videoLinks && sub.videoLinks.length > 0 ? (
                                    sub.videoLinks.map((link: string, i: number) => (
                                      <div key={i} className="flex items-center gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                                        <Video className="w-4 h-4 text-red-500" />
                                        <span className="text-sm font-medium truncate text-slate-600">{link}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No video links provided</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-2 bg-indigo-50/30 p-6 rounded-[24px] border border-indigo-100/30">
                              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Target Audience</h4>
                              <p className="text-slate-600 leading-relaxed font-medium">
                                {sub.targetAudience}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ))}
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
                  Our AI curriculum designer and content review team are currently analyzing your inputs.
                  You'll be notified via your registered email as soon as the first draft is ready for your input in the dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // Wizard View
  return (
    <SiteLayout headerProps={{ onLogout: () => logoutAndRedirect("/") }}>
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto mb-12">
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
              Create Your Course
            </h1>
            <p className="text-lg text-slate-600">
              Complete the wizard to submit your course proposal to our content team.
            </p>
          </div>

          <div className="relative flex justify-between items-center px-4 mb-12">
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
                <span className={`text-xs mt-2 font-medium hidden sm:block ${currentStep === step.id ? "text-slate-900" : "text-muted-foreground"
                  }`}>
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
              <Card className="shadow-xl border-slate-200/60 overflow-hidden">
                <CardHeader className="bg-white/50 border-b border-slate-100">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {STEPS[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription>
                    Step {currentStep} of {STEPS.length}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-8">
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="courseName" className="text-base">Course Name</Label>
                        <Input
                          id="courseName"
                          placeholder="e.g. Advanced React Architecture"
                          value={formData.courseName}
                          onChange={(e) => updateFormData("courseName", e.target.value)}
                          className="h-12 text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-base">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(val) => updateFormData("category", val)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="Fullstack Development">Fullstack Development</SelectItem>
                            <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                            <SelectItem value="Data Science">Data Science</SelectItem>
                            <SelectItem value="Cyber Security">Cyber Security</SelectItem>
                            <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                            <SelectItem value="Blockchain & Web3">Blockchain & Web3</SelectItem>
                            <SelectItem value="Product Management">Product Management</SelectItem>
                            <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                            <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                            <SelectItem value="Finance & Fintech">Finance & Fintech</SelectItem>
                            <SelectItem value="Others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-base">Course Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe what learners will achieve..."
                          rows={4}
                          value={formData.description}
                          onChange={(e) => updateFormData("description", e.target.value)}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetAudience" className="text-base">Target Audience</Label>
                        <Textarea
                          id="targetAudience"
                          placeholder="Who is this course for? e.g. Senior Frontend Devs"
                          rows={2}
                          value={formData.targetAudience}
                          onChange={(e) => updateFormData("targetAudience", e.target.value)}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-white rounded-full shadow-sm">
                            <Layout className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">Planned Structure</h3>
                            <p className="text-sm text-slate-500">How many deep-dive modules do you envision?</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="moduleCount" className="text-lg font-semibold">Number of Modules</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-14 w-14 rounded-xl border-2 hover:bg-slate-50 transition-colors"
                                onClick={() => updateFormData("moduleCount", Math.max(1, formData.moduleCount - 1))}
                              >
                                <Minus className="w-5 h-5" />
                              </Button>
                              <Input
                                id="moduleCount"
                                type="number"
                                min={1}
                                max={50}
                                value={formData.moduleCount}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val)) updateFormData("moduleCount", Math.min(50, Math.max(1, val)));
                                }}
                                className="h-14 text-2xl font-bold w-24 text-center border-2 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-14 w-14 rounded-xl border-2 hover:bg-slate-50 transition-colors"
                                onClick={() => updateFormData("moduleCount", Math.min(50, formData.moduleCount + 1))}
                              >
                                <Plus className="w-5 h-5" />
                              </Button>
                              <div className="text-muted-foreground ml-4 flex flex-col">
                                <span className="font-semibold text-slate-700">Recommended: 4–15</span>
                                <span className="text-xs">Based on current platform analytics</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4">
                        <Label className="text-base">Additional Structure Notes (Optional)</Label>
                        <Textarea
                          placeholder="Tell the content team about any specific modules or flow you have in mind..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="priceHigh" className="text-base flex items-center gap-2">
                            Standard Price (₹) <span className="text-xs text-muted-foreground">(Highest)</span>
                          </Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              id="priceHigh"
                              type="number"
                              value={formData.priceHigh}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                updateFormData("priceHigh", isNaN(val) ? 0 : val);
                              }}
                              className="h-12 pl-12 text-lg border-2 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priceLow" className="text-base flex items-center gap-2">
                            Flash Sale Price (₹) <span className="text-xs text-muted-foreground">(Lowest)</span>
                          </Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              id="priceLow"
                              type="number"
                              value={formData.priceLow}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                updateFormData("priceLow", isNaN(val) ? 0 : val);
                              }}
                              className="h-12 pl-12 text-lg border-2 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-lg font-bold">Default Discount (%)</Label>
                          <span className="text-2xl font-extrabold text-primary">{formData.discountPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="90"
                          step="5"
                          value={formData.discountPercent}
                          onChange={(e) => updateFormData("discountPercent", parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div className="bg-slate-900 rounded-xl p-6 text-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Estimated Launch Price</p>
                            <h3 className="text-3xl font-bold mt-1">
                              ₹{(formData.priceHigh * (1 - formData.discountPercent / 100)).toLocaleString('en-IN')}
                            </h3>
                          </div>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                            Effective Discount Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-purple-100 rounded-2xl">
                          <Cpu className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">AI Companion Engine</h3>
                          <p className="text-slate-500">Power your course with structured AI feedback.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Preferred AI Provider</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => updateFormData("apiKeyProvider", "openai")}
                            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${formData.apiKeyProvider === "openai"
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-slate-100 hover:border-slate-200"
                              }`}
                          >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" alt="OpenAI" className="h-6 opacity-80" />
                            <span className="font-bold">OpenAI GPT-4</span>
                          </button>
                          <button
                            onClick={() => updateFormData("apiKeyProvider", "google")}
                            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${formData.apiKeyProvider === "google"
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-slate-100 hover:border-slate-200"
                              }`}
                          >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Gemini" className="h-6 opacity-80" />
                            <span className="font-bold">Google Gemini</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 mt-6">
                        <Label htmlFor="apiKeyEncrypted" className="text-base flex justify-between items-center">
                          <span>API Key (Optional)</span>
                        </Label>
                        <Input
                          id="apiKeyEncrypted"
                          type="password"
                          placeholder="Paste your API key here..."
                          value={formData.apiKeyEncrypted}
                          onChange={(e) => updateFormData("apiKeyEncrypted", e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-primary/50 transition-colors group cursor-pointer"
                      >
                        <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-10 h-10 text-slate-400 group-hover:text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Upload Course Materials</h3>
                        <Button variant="outline" className="rounded-full px-8 h-12 border-2">
                          Browse Files
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Selected Documents ({formData.uploadedDocuments.length})
                        </h4>
                        {formData.uploadedDocuments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary" />
                              <span className="text-sm font-medium">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateFormData("uploadedDocuments", formData.uploadedDocuments.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-base font-bold">External Video References</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://youtube.com/..."
                            className="h-12 text-base"
                            value={videoInput}
                            onChange={(e) => setVideoInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                          />
                          <Button size="icon" className="h-12 w-12 rounded-xl" onClick={handleAddVideo}>
                            <Plus className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3 pt-4">
                        {formData.videoLinks.map((link, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <Video className="w-5 h-5 text-red-500" />
                            <span className="flex-1 font-medium truncate text-slate-600">{link}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateFormData("videoLinks", formData.videoLinks.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep === 7 && (
                    <div className="space-y-8">
                      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                        <h3 className="text-2xl font-bold mb-6">Final Summary</h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Course Name</p>
                            <p className="text-lg font-semibold">{formData.courseName || "Untitled"}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Category</p>
                            <p className="text-lg font-semibold">{formData.category}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Price Range</p>
                            <p className="text-lg font-semibold">${formData.priceLow} - ${formData.priceHigh}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Structure</p>
                            <p className="text-lg font-semibold">{formData.moduleCount} Modules</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-slate-50/50 border-t border-slate-200/60 p-6 flex justify-between items-center">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className="flex items-center gap-2 hover:bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>

                  {currentStep === STEPS.length ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-full shadow-lg"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Proposal"}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextStep}
                      className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-full shadow-lg flex items-center gap-2"
                    >
                      Next Step <ChevronRight className="w-5 h-5" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SiteLayout>
  );
}
