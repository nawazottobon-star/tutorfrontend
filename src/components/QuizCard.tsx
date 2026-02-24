import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizCardProps {
  question: string;
  options: QuizOption[];
  onAnswer: (selectedOptionId: string) => void;
  showResult?: boolean;
  selectedAnswer?: string;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuizCard({
  question,
  options,
  onAnswer,
  showResult = false,
  selectedAnswer,
  questionNumber,
  totalQuestions
}: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>(selectedAnswer || '');

  const handleSubmit = () => {
    if (selectedOption) {
      onAnswer(selectedOption);
      console.log('Quiz answer submitted:', selectedOption);
    }
  };

  const getOptionIcon = (option: QuizOption) => {
    if (!showResult || selectedOption !== option.id) return null;
    return option.isCorrect ? (
      <CheckCircle className="w-5 h-5 text-green-500" data-testid="icon-correct" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" data-testid="icon-incorrect" />
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto hover-elevate" data-testid="card-quiz">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground" data-testid="text-question-counter">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: totalQuestions }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < questionNumber - 1
                    ? 'bg-green-500'
                    : index === questionNumber - 1
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
                data-testid={`indicator-question-${index + 1}`}
              />
            ))}
          </div>
        </div>
        <CardTitle className="text-xl font-semibold leading-relaxed" data-testid="text-question">
          {question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedOption}
          onValueChange={setSelectedOption}
          disabled={showResult}
          data-testid="group-quiz-options"
        >
          {options.map((option) => (
            <div
              key={option.id}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                showResult && selectedOption === option.id
                  ? option.isCorrect
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  : 'border-border hover:border-primary/50'
              }`}
              data-testid={`option-${option.id}`}
            >
              <RadioGroupItem value={option.id} id={option.id} />
              <Label
                htmlFor={option.id}
                className="flex-1 text-base cursor-pointer"
                data-testid={`label-${option.id}`}
              >
                {option.text}
              </Label>
              {getOptionIcon(option)}
            </div>
          ))}
        </RadioGroup>

        {!showResult && (
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="min-w-24"
              data-testid="button-submit-answer"
            >
              Submit
            </Button>
          </div>
        )}

        {showResult && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground" data-testid="text-explanation">
              {options.find(opt => opt.isCorrect)?.text && (
                <>
                  <strong>Correct answer:</strong> {options.find(opt => opt.isCorrect)?.text}
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}