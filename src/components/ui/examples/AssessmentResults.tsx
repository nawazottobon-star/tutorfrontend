import AssessmentResults from '../AssessmentResults';

export default function AssessmentResultsExample() {
  const mockRecommendations = [
    "Focus on advanced React patterns including custom hooks and context optimization",
    "Practice component composition and prop drilling solutions", 
    "Review state management with Redux and Zustand",
    "Strengthen understanding of React performance optimization techniques"
  ];

  const handleEnroll = () => {
    console.log('Enrolling in course...');
  };

  const handleRetake = () => {
    console.log('Retaking assessment...');
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <AssessmentResults
        score={75}
        totalQuestions={7}
        correctAnswers={5}
        timeSpent="8 minutes"
        recommendations={mockRecommendations}
        onEnroll={handleEnroll}
        onRetake={handleRetake}
      />
    </div>
  );
}