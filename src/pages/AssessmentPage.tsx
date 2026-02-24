import AssessmentResults from '@/components/AssessmentResults';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { useLocation } from 'wouter';

export default function AssessmentPage() {
  const [, setLocation] = useLocation();

  const handleEnroll = () => {
    setLocation('/enroll');
  };

  const handleRetake = () => {
    window.location.reload();
  };

  return (
    <SiteLayout>
      <div className="py-12 bg-background min-h-[calc(100vh-64px)]">
        <AssessmentResults
          score={85}
          totalQuestions={20}
          correctAnswers={17}
          timeSpent="12:45"
          recommendations={[
            "Review Module 2: React Fundamentals for a better understanding of hooks.",
            "Practice creating custom hooks to improve your architecture skills.",
            "Explore advanced patterns like HOCs and Render Props."
          ]}
          onEnroll={handleEnroll}
          onRetake={handleRetake}
        />
      </div>
    </SiteLayout>
  );
}
