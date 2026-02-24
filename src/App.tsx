import { Switch, Route } from "wouter";
import { useEffect, useRef } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { logoutAndRedirect, resetSessionHeartbeat, subscribeToSession } from "@/utils/session";
import NotFound from "@/pages/not-found";
import BecomeTutorPage from "@/pages/BecomeTutorPage";
import TutorDashboardPage from "@/pages/TutorDashboardPage";
import TutorLoginPage from "@/pages/TutorLoginPage";
import CoursePlayerPage from "@/pages/CoursePlayerPage";
import AssessmentPage from "@/pages/AssessmentPage";
import EnrollmentPage from "@/pages/EnrollmentPage";
function Router() {
  return (
    <Switch>
      {/* Tutor Routes Only */}
      <Route path="/become-a-tutor" component={BecomeTutorPage} />
      <Route path="/tutors/login" component={TutorLoginPage} />
      <Route path="/tutors" component={TutorDashboardPage} />
      <Route path="/tutor" component={TutorDashboardPage} />

      {/* Learner Routes */}
      <Route path="/course/:courseId/learn/:lessonSlug" component={CoursePlayerPage} />
      <Route path="/assessment" component={AssessmentPage} />
      <Route path="/enroll" component={EnrollmentPage} />

      {/* Default route - Tutor Landing Page */}
      <Route path="/" component={BecomeTutorPage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const hadSessionRef = useRef(false);
  const logoutTriggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isAuthCallback = () => window.location.pathname === "/auth/callback";

    const unsubscribe = subscribeToSession((session) => {
      if (session?.accessToken) {
        hadSessionRef.current = true;
        logoutTriggeredRef.current = false;
        return;
      }

      const storedAuth = window.localStorage.getItem("isAuthenticated") === "true";
      if ((hadSessionRef.current || storedAuth) && !isAuthCallback() && !logoutTriggeredRef.current) {
        logoutTriggeredRef.current = true;
        logoutAndRedirect("/");
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isAuthCallback()) {
        resetSessionHeartbeat();
      }
    };

    const handleFocus = () => {
      if (!isAuthCallback()) {
        resetSessionHeartbeat();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
