import { useState } from 'react';
import CourseSidebar from '../CourseSidebar';

export default function CourseSidebarExample() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mockSections = [
    {
      id: "getting-started",
      title: "1. Getting Started",
      completed: true,
      lessons: [
        { id: "intro", title: "Introduction to React", duration: "8 min", type: "video" as const, completed: true },
        { id: "setup", title: "Development Setup", duration: "12 min", type: "video" as const, completed: true },
        { id: "quiz1", title: "Knowledge Check", duration: "5 min", type: "quiz" as const, completed: true }
      ]
    },
    {
      id: "fundamentals",
      title: "2. React Fundamentals",
      completed: false,
      lessons: [
        { id: "components", title: "Components and JSX", duration: "15 min", type: "video" as const, completed: true },
        { id: "props", title: "Props and State", duration: "18 min", type: "video" as const, completed: false, current: true },
        { id: "events", title: "Event Handling", duration: "10 min", type: "video" as const, completed: false },
        { id: "reading1", title: "Best Practices Guide", duration: "8 min", type: "reading" as const, completed: false }
      ]
    },
    {
      id: "advanced",
      title: "3. Advanced Patterns",
      completed: false,
      lessons: [
        { id: "hooks", title: "Custom Hooks", duration: "20 min", type: "video" as const, completed: false },
        { id: "context", title: "Context API", duration: "16 min", type: "video" as const, completed: false },
        { id: "performance", title: "Performance Optimization", duration: "22 min", type: "video" as const, completed: false }
      ]
    }
  ];

  const handleLessonSelect = (sectionId: string, lessonId: string) => {
    console.log('Selected lesson:', sectionId, lessonId);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="h-screen bg-background flex">
      <CourseSidebar
        sections={mockSections}
        totalProgress={45}
        onLessonSelect={handleLessonSelect}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Course Content Sidebar</h2>
        <p className="text-muted-foreground">
          This sidebar shows the course structure with progress tracking and search functionality.
          Try collapsing/expanding and searching for lessons.
        </p>
      </div>
    </div>
  );
}