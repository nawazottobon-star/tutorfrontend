import VideoPlayer from '../VideoPlayer';

export default function VideoPlayerExample() {
  const mockChapters = [
    { id: "1", title: "Introduction", timestamp: 0 },
    { id: "2", title: "Setup Environment", timestamp: 120 },
    { id: "3", title: "Core Concepts", timestamp: 300 },
    { id: "4", title: "Practical Examples", timestamp: 480 }
  ];

  const handleProgress = (progress: number) => {
    console.log('Video progress:', progress + '%');
  };

  const handleComplete = () => {
    console.log('Video completed');
  };

  return (
    <div className="p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Lesson 1.1: Introduction to React Hooks</h2>
        <VideoPlayer
          videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          title="Introduction to React Hooks"
          chapters={mockChapters}
          onProgress={handleProgress}
          onComplete={handleComplete}
        />
        <div className="mt-4 text-sm text-muted-foreground">
          <p>This lesson covers the fundamentals of React hooks and their practical applications.</p>
        </div>
      </div>
    </div>
  );
}