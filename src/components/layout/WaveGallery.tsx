import React, { useState, useRef } from "react";
import styles from "./WaveGallery.module.css";
import {
  MousePointer2,
  Users,
  Settings,
  Search,
  Touchpad,
  BarChart3,
  Target,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import unclearStudentProgressImg from "@/assets/images/unclear_student_progress.png";
import delayedRiskDetectionImg from "@/assets/images/delayed_risk_detection.png";
import manualFollowUpsImg from "@/assets/images/manual_follow_ups.png";

interface Challenge {
  id: number;
  label: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  image: string;
}

const challenges: Challenge[] = [
  {
    id: 1,
    label: "Blind Spots",
    title: "Enrollment Blind Spots",
    desc: "Keeping track of coursework and batch distribution becomes messy over time. As student numbers increase, visibility into enrollment decreases.",
    icon: <Users className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000&h=1000",
  },
  {
    id: 2,
    label: "Progress",
    title: "Unclear Student Progress",
    desc: "Marks alone don’t reveal real learning patterns. Without visual trends, student performance patterns stay hidden until it's too late.",
    icon: <BarChart3 className="w-8 h-8" />,
    image: unclearStudentProgressImg,
  },
  {
    id: 3,
    label: "Risk",
    title: "Delayed Risk Detection",
    desc: "Struggling students often go unnoticed until exams exposure. Our system detects these patterns early to enable proactive intervention.",
    icon: <Target className="w-8 h-8" />,
    image: delayedRiskDetectionImg,
  },
  {
    id: 4,
    label: "Follow-up",
    title: "Manual Follow-Ups",
    desc: "Reaching out individually is operationally heavy. Our dashboard automates communication gaps and ensures consistent student engagement.",
    icon: <Touchpad className="w-8 h-8" />,
    image: manualFollowUpsImg,
  },
  {
    id: 5,
    label: "Scattered",
    title: "Scattered Course Management",
    desc: "Updating structure across batches is heavy work. Manage your entire curriculum from a single, centralized interface designed for speed.",
    icon: <Settings className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1000&h=1000",
  },
  {
    id: 6,
    label: "Noise",
    title: "Data Without Direction",
    desc: "Attendance and assessments create noise instead of clarity. Our AI-driven analytics turns raw records into structured, actionable insights.",
    icon: <Search className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000&h=1000",
  },
];

const WaveGallery: React.FC = () => {
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (id: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveCardId(id);
    }, 300); // Shorter dwell for more items
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveCardId(null);
  };

  const handleNav = (direction: "next" | "prev", e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardId((prev) => {
      const current = prev ?? (direction === "next" ? 0 : 1);
      if (direction === "next") {
        const next = current + 1;
        return next > challenges.length ? 1 : next;
      } else {
        const prevId = current <= 1 ? challenges.length : current - 1;
        return prevId;
      }
    });
  };

  return (
    <section className={styles.galleryWrapper}>

      <div className={styles.intro}>
        <span className={styles.badge}>Identifying the Gap</span>
        <h2 className={styles.introTitle}>
          The <span className={styles.highlight}>Intelligence</span> Gap in Modern Tutoring.
        </h2>
      </div>

      <div
        className={styles.galleryContainer}
        data-has-active={activeCardId !== null}
      >
        <button
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={(e) => handleNav("prev", e)}
          aria-label="Previous challenge"
        >
          <ChevronLeft />
        </button>

        <button
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={(e) => handleNav("next", e)}
          aria-label="Next challenge"
        >
          <ChevronRight />
        </button>

        {challenges.map((item) => (
          <div
            key={item.id}
            className={styles.card}
            data-active={activeCardId === item.id}
            onMouseEnter={() => handleMouseEnter(item.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={styles.imageLayer}
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className={styles.overlay} />

            <div className={styles.iconWrapper}>
              <div className={styles.iconInner}>
                {item.icon}
              </div>
            </div>

            <div className={styles.content}>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WaveGallery;
