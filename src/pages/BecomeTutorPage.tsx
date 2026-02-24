import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  BarChart3,
  Video,
  Globe,
  ArrowRight,
  CheckCircle2,
  X,
  ShieldCheck,
  TrendingUp,
  Brain,
  Layout,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { buildApiUrl } from "@/lib/api";
import { writeStoredSession, resetSessionHeartbeat } from '@/utils/session';
import type { StoredSession } from '@/types/session';
import FloatingCampusHero from '@/components/layout/FloatingCampusHero';
import WaveGallery from '@/components/layout/WaveGallery';
import FeatureGrid from '@/components/layout/FeatureGrid';
import TutorNavbar from '@/components/layout/TutorNavbar';
import TutorFooter from '@/components/layout/TutorFooter';
import { Timeline } from '@/components/ui/timeline';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// --- 1. TYPES & INTERFACES ---
interface TutorApplication {
  fullName: string;
  email: string;
  phone: string;
  headline: string;
  expertiseArea: string;
  yearsExperience: number;
  courseTitle: string;
  availability: string;
  courseDescription: string;
  targetAudience: string;
}

// --- 2. Description helper (client-safe template) ---
const THEME = {
  bg: '#FDFCF0',      // Warm Ivory (Base)
  primary: '#B24531', // Deep Burnt Orange
  accent: '#E64833',  // Coral Highlights
  text: '#1E3A47',    // Warm Charcoal
  muted: '#1E3A47/60',
  card: '#FFFFFF',
  secondaryBg: '#FFF5EC' // Soft Peach Overlay
};

// --- DESCRIPTION HELPER ---
const generateCourseDescription = async (
  title: string,
  expertise: string,
): Promise<string> => {
  if (!title || !expertise) {
    return "Describe your proposed curriculum, learning objectives, and the skills learners will gain.";
  }

  return [
    `${title} takes learners inside real workflows that ${expertise.toLowerCase()} teams use every day.`,
    "You will define a production-grade project, ship weekly deliverables, and review your work with industry mentors.",
    "By the end, participants graduate with a polished portfolio, repeatable playbooks, and the confidence to lead in their role.",
  ].join(" ");
};

const GrainOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.035] optimize-gpu"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3F%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      mixBlendMode: 'multiply'
    }}
  />
);


const SectionHeader = ({ badge, title, subline, light = false }: { badge?: string; title: React.ReactNode; subline?: string; light?: boolean }) => (
  <div className="mb-4 text-center max-w-3xl mx-auto">
    {badge && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-[10px] font-black uppercase tracking-[0.2em] ${light ? 'bg-white/10 text-white/80' : 'bg-[#B24531]/10 text-[#B24531]'}`}
      >
        {badge}
      </motion.div>
    )}
    <motion.h3
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${light ? 'text-white' : 'text-[#1E3A47]'}`}
    >
      {title}
    </motion.h3>
    {subline && (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className={`text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed ${light ? 'text-white/60' : 'text-[#1E3A47]/60'}`}
      >
        {subline}
      </motion.p>
    )}
  </div>
);


const FloatingShapes = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden optimize-gpu">
    <motion.div
      animate={{
        y: [0, -20, 0],
        x: [0, 15, 0],
        opacity: [0.03, 0.06, 0.03],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#B24531] to-transparent blur-[80px] will-change-transform"
    />
    <motion.div
      animate={{
        y: [0, 25, 0],
        x: [0, -15, 0],
        opacity: [0.02, 0.05, 0.02],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute bottom-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-[#1E3A47] to-transparent blur-[100px] will-change-transform"
    />
  </div>
);





// --- REVEAL VARIANTS ---
const revealVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

// --- 4. MAIN COMPONENT ---
const timelineData = [
  {
    badge: "STEP 01",
    title: "Submit Your Vision",
    description: "Validate real learner demand using platform insights and data signals. Start with a simple course proposal.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
  },
  {
    badge: "STEP 02",
    title: "Design Your Syllabus",
    description: "Co-create your curriculum with AI-powered guidance and expert feedback to ensure high engagement and retention.",
    image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=2070&auto=format&fit=crop"
  },
  {
    badge: "STEP 03",
    title: "Onboarding & QA",
    description: "Go through our streamlined quality verification to ensure your content meets the platform's premium standards.",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=2070&auto=format&fit=crop"
  },
  {
    badge: "STEP 04",
    title: "Launch & Monetize",
    description: "Go live and start earning. Track your performance with real-time analytics and automated student feedback loops.",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070&auto=format&fit=crop"
  }
];

const initialFormState: TutorApplication = {
  fullName: "",
  email: "",
  phone: "",
  headline: "",
  expertiseArea: "",
  yearsExperience: 0,
  courseTitle: "",
  availability: "",
  courseDescription: "",
  targetAudience: "",
};

const BecomeTutor: React.FC = () => {
  const [formData, setFormData] = useState<TutorApplication>({ ...initialFormState });
  const [, setLocation] = useLocation();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Typewriter state
  const fullText = "Your knowledge can change a career.";
  const [typedText, setTypedText] = useState("");

  const openLoginModal = () => {
    setLoginError(null);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError(null);
    setIsLoggingIn(false);
  };

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setTypedText((prev: string) => fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  // Scroll Reveal Observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: TutorApplication) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAiGenerate = async () => {
    if (!formData.courseTitle || !formData.expertiseArea) {
      alert("Please enter a Course Title and Area of Expertise first.");
      return;
    }

    setIsGenerating(true);
    try {
      const description = await generateCourseDescription(formData.courseTitle, formData.expertiseArea);
      setFormData(prev => ({ ...prev, courseDescription: description }));
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTutorLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/tutors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message ?? "Wrong email or wrong password");
      }

      const payload = await response.json();
      const session: StoredSession = {
        accessToken: payload.session?.accessToken,
        accessTokenExpiresAt: payload.session?.accessTokenExpiresAt,
        refreshToken: payload.session?.refreshToken,
        refreshTokenExpiresAt: payload.session?.refreshTokenExpiresAt,
        sessionId: payload.session?.sessionId,
        role: payload.user?.role,
        userId: payload.user?.id,
        email: payload.user?.email,
        fullName: payload.user?.fullName,
      };

      writeStoredSession(session);
      resetSessionHeartbeat();

      const userPayload = {
        id: payload.user?.id,
        email: payload.user?.email,
        fullName: payload.user?.fullName,
        role: payload.user?.role,
        tutorId: payload.user?.tutorId,
        displayName: payload.user?.displayName,
      };

      localStorage.setItem("user", JSON.stringify(userPayload));
      localStorage.setItem("isAuthenticated", "true");

      closeLoginModal();
      setLocation("/tutors");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Wrong email or wrong password");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    setIsSubmitting(true);

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || undefined,
      headline: formData.headline.trim(),
      courseTitle: formData.courseTitle.trim(),
      courseDescription: formData.courseDescription.trim(),
      targetAudience: formData.targetAudience.trim(),
      expertiseArea: formData.expertiseArea.trim(),
      experienceYears: Number(formData.yearsExperience) || 0,
      availability: formData.availability.trim(),
    };

    try {
      const res = await fetch("/api/tutor-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message ?? "Failed to submit tutor application.");
      }

      setSubmitMessage("Proposal submitted successfully! Our team will be in touch soon.");
      setFormData({ ...initialFormState });
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FFC48C] via-[#FFF5EC] to-[#FFF5EC] text-[#1E3A47] overflow-x-hidden font-sans">
      <GrainOverlay />

      <TutorNavbar
        onApply={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })}
        onLogin={openLoginModal}
      />

      {/* Hero Section */}
      <FloatingCampusHero
        onApply={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })}
        onLogin={openLoginModal}
      />

      <motion.section
        id="gap"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="scroll-mt-24"
      >
        <WaveGallery />
      </motion.section>

      <div className="relative h-40 w-full -mt-20 mb-[-1px] z-20 pointer-events-none overflow-hidden">
        {/* Layered Liquid Waves */}
        <svg viewBox="0 0 1440 120" className="absolute bottom-[-1px] w-full h-full" preserveAspectRatio="none">
          {/* Layer 1: Semi-transparent Deep Peach */}
          <path
            d="M0,60 C480,120 960,0 1440,60 L1440,120 L0,120 Z"
            fill="#FFC48C"
            fillOpacity="0.4"
          />
          {/* Layer 2: Softer Peach-Ivory blend */}
          <path
            d="M0,80 C360,20 1080,140 1440,80 L1440,120 L0,120 Z"
            fill="#FFF5EC"
            fillOpacity="0.6"
          />
          {/* Layer 3: Solid Bottom Wave (The floor) */}
          <path
            d="M0,100 C480,150 960,50 1440,100 L1440,120 L0,120 Z"
            fill="#FFF5EC"
          />
        </svg>
      </div>


      <motion.section
        id="ecosystem"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={revealVariants}
        className="pt-2 pb-0 relative overflow-hidden scroll-mt-24"
      >
        <FloatingShapes />
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle Eco-Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(#1E3A47 0.5px, transparent 0.5px)',
              backgroundSize: '30px 30px',
              maskImage: 'linear-gradient(to bottom, black, transparent)'
            }} />

          {/* Layered Atmospheric Glows (Blobs) */}
          <div className="absolute top-[10%] right-[-10%] w-[800px] h-[800px] bg-orange-300/30 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[20%] left-[-15%] w-[700px] h-[700px] bg-amber-200/40 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-orange-100/20 blur-[160px] rounded-full" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 mb-0">
          <SectionHeader
            badge="ECOSYSTEM READY"
            title={
              <>
                Why <span className="highlight-premium">teach</span> with us?
              </>
            }
            subline="Experience a living platform that works as hard as you do."
          />
        </div>

        {/* Feature Grid Section */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10 pb-2">
          <FeatureGrid />
        </div>

      </motion.section>

      <div className="relative h-24 w-full -mt-12 mb-[-1px] z-20 pointer-events-none overflow-hidden">
        {/* Layered Liquid Waves - FeatureGrid Transition */}
        <svg viewBox="0 0 1440 120" className="absolute bottom-[-1px] w-full h-full" preserveAspectRatio="none">
          {/* Layer 1: Semi-transparent Peach */}
          <path
            d="M0,40 C480,100 960,0 1440,40 L1440,120 L0,120 Z"
            fill="#FFC48C"
            fillOpacity="0.3"
          />
          {/* Layer 2: Soft Ivory */}
          <path
            d="M0,60 C360,10 1080,120 1440,60 L1440,120 L0,120 Z"
            fill="#FFF5EC"
            fillOpacity="0.5"
          />
          {/* Layer 3: Main Base Wave */}
          <path
            d="M0,80 C480,130 960,30 1440,80 L1440,120 L0,120 Z"
            fill="#FFF5EC"
          />
        </svg>
      </div>

      <motion.section
        id="process"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={revealVariants}
        className="pt-0 pb-12 relative overflow-hidden bg-gradient-to-b from-[#FFF5EC] via-[#FFD8B1]/20 to-[#FFF5EC] scroll-mt-24"
      >
        <FloatingShapes />
        {/* Background Atmosphere for Timeline */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle Eco-Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(#1E3A47 0.5px, transparent 0.5px)',
              backgroundSize: '30px 30px',
              maskImage: 'linear-gradient(to bottom, black, transparent)'
            }} />

          {/* Layered Sunset Atmospheric Glows */}
          <div className="absolute top-[20%] left-[-15%] w-[800px] h-[800px] bg-orange-300/25 blur-[140px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-10%] w-[900px] h-[900px] bg-amber-200/30 blur-[160px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1000px] bg-[#FFC48C]/15 blur-[180px] rounded-full" />
        </div>
        <Timeline
          data={timelineData}
          badge="STRATEGIC JOURNEY"
          title={
            <>
              How it <span className="highlight-premium">works</span>
            </>
          }
          subline="Your journey to becoming a top-tier tutor starts here. Follow these simple steps to launch your workspace."
        />
      </motion.section>

      <div className="relative h-24 w-full -mt-12 mb-[-1px] z-20 pointer-events-none overflow-hidden">
        {/* Layered Liquid Waves - Timeline to Form Transition */}
        <svg viewBox="0 0 1440 120" className="absolute bottom-[-1px] w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,60 C480,0 960,120 1440,60 L1440,120 L0,120 Z"
            fill="#FFF5EC"
            fillOpacity="0.4"
          />
          <path
            d="M0,80 C360,140 1080,20 1440,80 L1440,120 L0,120 Z"
            fill="#FFD8B1"
            fillOpacity="0.2"
          />
          <path
            d="M0,100 C480,50 960,150 1440,100 L1440,120 L0,120 Z"
            fill="#FFF5EC"
          />
        </svg>
      </div>


      {/* Application Form Section */}
      <motion.section
        id="apply"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        variants={revealVariants}
        className="pt-4 pb-24 px-6 md:px-12 relative scroll-mt-24 bg-gradient-to-b from-[#FFF5EC] to-[#FFD8B1]/30"
      >
        <div className="max-w-[1400px] mx-auto relative z-10">
          <SectionHeader
            badge="Join the Team"
            title={
              <>
                Ready to make an <span className="highlight-premium">impact</span>?
              </>
            }
            subline="Fill out the form below to apply. We review every application personally."
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-black/20 border border-white/10"
          >
            <form onSubmit={handleSubmit} className="space-y-16">
              {/* Personal Details */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-[#1E3A47]/10 pb-4">
                  <ShieldCheck className="w-5 h-5 text-[#B24531]" />
                  <h4 className="text-[15px] font-black uppercase tracking-widest text-[#B24531]">Personal Details</h4>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'John Doe' },
                    { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
                    { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
                    { label: 'Professional Headline', name: 'headline', type: 'text', placeholder: 'Sr. AI Engineer' }
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-[13px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1">{field.label}</label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-[#1E3A47]/10 focus:border-[#B24531]/20 rounded-2xl px-6 py-4 text-[18px] text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Expertise & Proposal */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-[#1E3A47]/10 pb-4">
                  <Brain className="w-5 h-5 text-[#B24531]" />
                  <h4 className="text-[15px] font-black uppercase tracking-widest text-[#B24531]">Expertise & Proposal</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[13px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1">Area of Expertise</label>
                    <input
                      type="text"
                      name="expertiseArea"
                      value={formData.expertiseArea}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-[#1E3A47]/10 focus:border-[#B24531]/20 rounded-2xl px-6 py-4 text-[18px] text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all"
                      placeholder="e.g. LLMs, Python, Computer Vision"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1">Years of Experience</label>
                    <input
                      type="number"
                      name="yearsExperience"
                      value={formData.yearsExperience}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-[#1E3A47]/10 focus:border-[#B24531]/20 rounded-2xl px-6 py-4 text-[18px] text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1">Proposed Course Title</label>
                    <input
                      type="text"
                      name="courseTitle"
                      value={formData.courseTitle}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-[#1E3A47]/10 focus:border-[#B24531]/20 rounded-2xl px-6 py-4 text-[18px] text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all"
                      placeholder="e.g. Advanced RAG Systems"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1">Availability</label>
                    <div className="relative">
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-[#1E3A47]/10 focus:border-[#B24531]/20 rounded-2xl px-6 py-4 text-[18px] text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all cursor-pointer"
                      >
                        <option value="">Select availability</option>
                        <option value="immediate">Immediately</option>
                        <option value="1month">In 1 month</option>
                        <option value="3months">In 3 months</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#B24531]">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[13px] font-black uppercase tracking-wider text-[#1E3A47]/40">Course Description</label>
                      <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 text-xs font-black text-[#B24531] hover:text-[#E64833] disabled:opacity-50 transition-colors uppercase tracking-widest bg-[#B24531]/5 px-3 py-1 rounded-full"
                      >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {isGenerating ? 'Thinking...' : 'AI Assist'}
                      </button>
                    </div>
                    <textarea
                      name="courseDescription"
                      rows={4}
                      value={formData.courseDescription}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-[#1E3A47]/10 focus:border-[#B24531]/20 rounded-2xl px-6 py-4 text-[18px] text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all resize-none"
                      placeholder="Briefly describe the curriculum..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[13px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1 pt-1 block">Target Audience</label>
                    <textarea
                      name="targetAudience"
                      rows={4}
                      value={formData.targetAudience}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-[#1E3A47]/10 focus:border-[#B24531]/20 rounded-2xl px-6 py-4 text-[18px] text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all resize-none"
                      placeholder="Who is this for?"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-[#1E3A47]/10">
                <div className="flex items-start gap-4 text-[#1E3A47]/40 max-w-sm">
                  <CheckCircle2 size={24} className="text-[#B24531] shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">
                    By submitting, you agree to our Terms. We review every application personally within 48 hours.
                  </p>
                </div>

                <div className="w-full md:w-auto text-center md:text-right space-y-4">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full md:w-auto px-16 py-6 bg-[#B24531] text-white font-black text-lg rounded-2xl shadow-2xl shadow-[#B24531]/20 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                    {!isSubmitting && <ArrowRight size={20} strokeWidth={3} />}
                  </motion.button>
                  {submitMessage && (
                    <p className={`text-sm font-bold ${submitMessage.includes('successfully') ? 'text-emerald-600' : 'text-[#B24531]'}`}>
                      {submitMessage}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.section>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] px-6 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLoginModal}
              className="absolute inset-0 bg-[#1E3A47]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-[3rem] bg-white p-12 shadow-2xl text-left border border-[#1E3A47]/5"
            >
              <button
                type="button"
                onClick={closeLoginModal}
                className="absolute right-8 top-8 text-[#1E3A47]/40 hover:text-[#B24531] transition-colors"
              >
                <X size={24} />
              </button>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B24531]">
                  Tutor Console
                </p>
                <h3 className="text-4xl font-black text-[#1E3A47] tracking-tight">Welcome back</h3>
                <p className="text-sm text-[#1E3A47]/60 font-medium">
                  Access your courses, enrollments, and learner progress.
                </p>
              </div>

              <form className="mt-12 space-y-6" onSubmit={handleTutorLogin}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-4 text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:border-[#B24531]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all"
                    placeholder="you@ottolearn.com"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A47]/40 px-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-4 text-[#1E3A47] font-bold placeholder-[#1E3A47]/20 focus:border-[#B24531]/20 focus:outline-none focus:ring-4 focus:ring-[#B24531]/5 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {loginError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-[#B24531] bg-[#B24531]/5 rounded-xl px-4 py-3"
                  >
                    {loginError}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoggingIn}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-2xl bg-[#B24531] py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[#B24531]/20 transition-all disabled:opacity-50"
                >
                  {isLoggingIn ? "Signing in..." : "Login to Console"}
                </motion.button>

                <p className="text-center text-[10px] font-bold text-[#1E3A47]/40 uppercase tracking-widest">
                  Protected by OttoLearn Security
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <TutorFooter />
    </div>
  );
};

export default BecomeTutor;
