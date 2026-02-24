import { useState } from 'react';
import CourseSidebar from '@/components/CourseSidebar';
import VideoPlayer from '@/components/VideoPlayer';
import ChatBot from '@/components/ChatBot';
import { SiteLayout } from '@/components/layout/SiteLayout';

export default function CoursePlayerPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentLesson, setCurrentLesson] = useState({
    title: "Welcome to AI Journey",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
  });

  const mockSections = [
    {
      id: "getting-started",
      title: "1. Getting Started",
      completed: true,
      lessons: [
        { id: "intro", title: "Introduction to AI", duration: "8 min", type: "video" as const, completed: true },
        { id: "setup", title: "Environment Setup", duration: "12 min", type: "video" as const, completed: false, current: true }
      ]
    }
  ];

  const handleLessonSelect = (sectionId: string, lessonId: string) => {
    console.log('Selected lesson:', sectionId, lessonId);
    // In a real app, we would fetch the lesson data here
  };

  return (
    <SiteLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
        <CourseSidebar
          sections={mockSections}
          totalProgress={45}
          onLessonSelect={handleLessonSelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">{currentLesson.title}</h1>
            <VideoPlayer
              videoUrl={currentLesson.videoUrl}
              title={currentLesson.title}
            />
            <div className="prose dark:prose-invert max-w-none">
              <h2>About this lesson</h2>
              <p>This is a placeholder for the lesson content. In this lesson, you will learn the fundamentals of AI and how to set up your development environment.</p>
            </div>
          </div>
        </main>

        <ChatBot courseId="ai-in-web-development" courseName="AI in Web Development" />
      </div>
    </SiteLayout>
  );
}
