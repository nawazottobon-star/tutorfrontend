import React from 'react';
import {
  Users,
  BarChart3,
  MousePointer2,
  Sparkles,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';
import styles from './FeatureGrid.module.css';

interface Feature {
  id: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const features: Feature[] = [
  {
    id: 1,
    title: "Unified Enrollment Control",
    desc: "Manage students across courses and batches from one structured dashboard.",
    icon: <Users className="w-6 h-6" />
  },
  {
    id: 2,
    title: "Clear Progress Visibility",
    desc: "Track performance trends and engagement signals in real time.",
    icon: <BarChart3 className="w-6 h-6" />
  },
  {
    id: 3,
    title: "Direct Action Tools",
    desc: "Send emails and take intervention steps instantly from one place.",
    icon: <MousePointer2 className="w-6 h-6" />
  },
  {
    id: 4,
    title: "AI Copilot Assistance",
    desc: "Ask questions, analyze data, and get intelligent support instantly.",
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    id: 5,
    title: "Smart Risk Detection",
    desc: "Identify struggling students early through performance patterns.",
    icon: <ShieldAlert className="w-6 h-6" />
  },
  {
    id: 6,
    title: "Flexible Revenue Model",
    desc: "Earn 70% with platform APIs or 80% using your own payment APIs.",
    icon: <TrendingUp className="w-6 h-6" />
  }
];

const FeatureGrid: React.FC = () => {
  return (
    <div className={styles.gridContainer}>
      {features.map((feature) => (
        <div key={feature.id} className={styles.card}>
          <div className={styles.slideOverlay} />

          <div className={styles.contentWrapper}>
            <div className={styles.iconContainer}>
              <div className={styles.iconCircle}>
                {feature.icon}
              </div>
            </div>

            <h4 className={styles.title}>{feature.title}</h4>
            <p className={styles.description}>{feature.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureGrid;
