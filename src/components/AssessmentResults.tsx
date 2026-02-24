import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';

interface AssessmentResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: string;
  recommendations: string[];
  onEnroll: () => void;
  onRetake: () => void;
}

export default function AssessmentResults({
  score,
  totalQuestions,
  correctAnswers,
  timeSpent,
  recommendations,
  onEnroll,
  onRetake
}: AssessmentResultsProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = () => {
    if (score >= 80) return { text: 'Excellent', variant: 'default' as const };
    if (score >= 60) return { text: 'Good', variant: 'secondary' as const };
    return { text: 'Needs Improvement', variant: 'destructive' as const };
  };

  const scoreBadge = getScoreBadge();

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="container-assessment-results">
      {/* Score Overview */}
      <Card className="text-center" data-testid="card-score-overview">
        <CardHeader>
          <CardTitle className="text-2xl mb-4" data-testid="title-results">
            Assessment Complete!
          </CardTitle>
          <div className="flex justify-center mb-4">
            <div className={`text-6xl font-bold ${getScoreColor()}`} data-testid="text-score">
              {score}%
            </div>
          </div>
          <Badge variant={scoreBadge.variant} className="text-lg px-4 py-2" data-testid="badge-score-level">
            {scoreBadge.text}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="flex items-center justify-center space-x-2" data-testid="stat-correct-answers">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Correct Answers</span>
              <span className="font-semibold">{correctAnswers}/{totalQuestions}</span>
            </div>
            <div className="flex items-center justify-center space-x-2" data-testid="stat-time-spent">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Time Spent</span>
              <span className="font-semibold">{timeSpent}</span>
            </div>
            <div className="flex items-center justify-center space-x-2" data-testid="stat-accuracy">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <span className="font-semibold">{Math.round((correctAnswers / totalQuestions) * 100)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card data-testid="card-recommendations">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2" data-testid="title-recommendations">
            <BookOpen className="w-5 h-5" />
            <span>Personalized Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                data-testid={`recommendation-${index}`}
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-foreground">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center" data-testid="container-action-buttons">
        <Button
          onClick={onEnroll}
          size="lg"
          className="min-w-48"
          data-testid="button-enroll-course"
        >
          Enroll in Course
        </Button>
        <Button
          onClick={onRetake}
          variant="outline"
          size="lg"
          className="min-w-48"
          data-testid="button-retake-assessment"
        >
          Retake Assessment
        </Button>
      </div>
    </div>
  );
}