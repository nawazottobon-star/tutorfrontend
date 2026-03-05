import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { getAuthHeaders } from "@/utils/session";
import { 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layout, 
  MessageSquare, 
  ArrowRight,
  RefreshCw
} from "lucide-react";

export default function CourseCreationPendingPage() {
  const [, setLocation] = useLocation();
  const [dots, setDots] = useState("");

  // Animation for the "Building" text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Poll for status updates
  const { data: submissionsData, refetch, isFetching } = useQuery({
    queryKey: ["/api/course-submissions/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/course-submissions/me", undefined, { headers: getAuthHeaders() });
      return res.json();
    },
    refetchInterval: 30000, // Sync every 30 seconds
  });

  const latestSubmission = submissionsData?.submissions?.[0];

  // If status is 'draft_ready', redirect to dashboard
  useEffect(() => {
    if (latestSubmission && (latestSubmission.status === 'draft_ready' || latestSubmission.status === 'accepted')) {
      setLocation("/tutors");
    }
  }, [latestSubmission, setLocation]);

  return (
    <SiteLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden rounded-[32px]">
              <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-indigo-600 w-full" />
              <CardContent className="p-12 text-center">
                <div className="relative w-32 h-32 mx-auto mb-10">
                   <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                   <div className="relative bg-white rounded-full w-full h-full shadow-lg flex items-center justify-center border-4 border-primary/10">
                      <Sparkles className="w-14 h-14 text-primary animate-pulse" />
                   </div>
                </div>

                <h1 className="text-4xl font-black text-slate-900 mb-4">
                  Course Crafting in Progress{dots}
                </h1>
                <p className="text-xl text-slate-600 mb-12 max-w-lg mx-auto leading-relaxed">
                  We've received your proposal for <strong>"{latestSubmission?.courseName || "your new course"}"</strong>. 
                  Our content team is now designing your curriculum.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                   <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                      <div className="p-3 bg-blue-50 w-fit rounded-xl mx-auto">
                        <Clock className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Reviewing Idea</p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none">Completed</Badge>
                   </div>
                   <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                      <div className="p-3 bg-amber-50 w-fit rounded-xl mx-auto">
                        <Layout className="w-6 h-6 text-amber-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Designing Modules</p>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none animate-pulse">In Progress</Badge>
                   </div>
                   <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                      <div className="p-3 bg-slate-50 w-fit rounded-xl mx-auto opacity-50">
                        <CheckCircle2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">Draft Ready</p>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none">Pending</Badge>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col lg:flex-row items-center gap-6 justify-between">
                   <div className="text-left">
                      <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" /> Questions?
                      </h4>
                      <p className="text-slate-400 text-sm">Our team might reach out via email for clarification.</p>
                   </div>
                   <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Button 
                        onClick={() => setLocation("/tutors")}
                        className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-full h-12 px-8 flex items-center gap-2 transition-all shadow-xl shadow-white/5 border-none"
                      >
                         <Layout className="w-4 h-4" />
                         Back to Dashboard
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => refetch()}
                        className="border-slate-600 bg-transparent text-white hover:bg-white/10 hover:border-white rounded-full h-12 px-8 flex items-center gap-2 transition-all"
                      >
                         {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                         Check for Updates
                      </Button>
                   </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 text-slate-500 text-sm">
                   Estimated turnaround: <span className="font-bold text-slate-900">24-48 hours</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </div>
  );
}
