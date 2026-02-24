import { useState } from 'react';
import LessonTabs from '../LessonTabs';

export default function LessonTabsExample() {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div className="p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Lesson Tabs Preview</h2>
        <LessonTabs
          guideContent={`# Sample Lesson\n\nThis example demonstrates how the lesson guide renders rich text content.\n\n- Browse the outline above\n- Toggle completion below to see UI states`}
          isCompleted={isCompleted}
          isUpdating={false}
          onToggleComplete={(nextState) => setIsCompleted(nextState)}
        />
      </div>
    </div>
  );
}

