import QuizCard from '../QuizCard';

export default function QuizCardExample() {
  const mockQuestion = "Which of the following is the primary benefit of using React hooks?";
  const mockOptions = [
    { id: "a", text: "Better performance in all cases", isCorrect: false },
    { id: "b", text: "Simplified state management and lifecycle methods", isCorrect: true },
    { id: "c", text: "Automatic code optimization", isCorrect: false },
    { id: "d", text: "Built-in testing capabilities", isCorrect: false }
  ];

  const handleAnswer = (selectedOptionId: string) => {
    console.log('Selected answer:', selectedOptionId);
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <QuizCard
        question={mockQuestion}
        options={mockOptions}
        onAnswer={handleAnswer}
        questionNumber={3}
        totalQuestions={7}
      />
    </div>
  );
}