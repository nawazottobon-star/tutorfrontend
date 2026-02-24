import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { ChevronLeft, ChevronRight, Search, Clock, Check, Lock } from 'lucide-react';

export interface SidebarLesson {
  id: string;
  slug: string;
  title: string;
  rawTitle?: string;
  duration: string;
  completed: boolean;
  current?: boolean;
  progress?: number;
  type?: 'video' | 'reading' | 'quiz';
  videoUrl?: string;
  notes?: string;
  isPreview?: boolean;
  locked?: boolean;
  moduleNo?: number;
  topicNumber?: number;
  topicPairIndex?: number;
  moduleTitle?: string;
}

export interface SidebarModule {
  id: string;
  title: string;
  lessons: SidebarLesson[];
}

interface CourseSidebarProps {
  modules: SidebarModule[];
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  onLessonSelect: (lessonSlug: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onToggleLessonComplete?: (lessonId: string, shouldComplete: boolean) => void;
}

export default function CourseSidebar({
  modules,
  progressPercent,
  completedCount,
  totalCount,
  onLessonSelect,
  isCollapsed = false,
  onToggleCollapse,
  onToggleLessonComplete
}: CourseSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const initialExpanded = modules.length > 0 ? modules[0].id : undefined;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    initialExpanded ? new Set([initialExpanded]) : new Set()
  );

  useEffect(() => {
    if (modules.length === 0) {
      setExpandedModules(new Set());
      return;
    }

    const existingIds = new Set(modules.map((module) => module.id));
    const activeModule = modules.find((module) => module.lessons.some((lesson) => lesson.current)) ?? null;

    setExpandedModules((previous) => {
      const next = new Set<string>();

      previous.forEach((id) => {
        if (existingIds.has(id)) {
          next.add(id);
        }
      });

      const defaultModule = activeModule ?? modules[0];
      if (defaultModule) {
        next.add(defaultModule.id);
      }

      if (next.size === previous.size) {
        let identical = true;
        next.forEach((id) => {
          if (!previous.has(id)) {
            identical = false;
          }
        });
        if (identical) {
          return previous;
        }
      }

      return next;
    });
  }, [modules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return modules;
    }

    return modules
      .map((module) => ({
        ...module,
        lessons: module.lessons.filter((lesson) =>
          `${module.title} ${lesson.title}`.toLowerCase().includes(query)
        )
      }))
      .filter((module) => module.lessons.length > 0);
  }, [modules, searchQuery]);

  if (isCollapsed) {
    return (
      <div
        className="relative flex h-screen w-14 sm:w-16 flex-col items-center justify-start pt-3 bg-sidebar/98 border-r border-sidebar-border/80"
        data-testid="sidebar-collapsed"
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[3px] rounded-l-full bg-gradient-to-b from-primary/40 via-primary to-primary/40 shadow-[0_0_24px_rgba(59,130,246,0.55)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-4">
          {progressPercent}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleCollapse}
          data-testid="button-expand-sidebar"
          className="h-10 w-10 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-[0_4px_18px_rgba(59,130,246,0.25)] transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="course-player-sidebar min-w-80 max-w-96 w-80 border-r flex flex-col h-screen overflow-x-hidden"
      data-testid="sidebar-expanded"
    >
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" data-testid="title-course-content">
            Course Content
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleCollapse}
            data-testid="button-collapse-sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium" data-testid="text-progress-percentage">
              {progressPercent}%
            </span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2"
            data-testid="progress-bar-course"
          />
          <div className="text-xs text-muted-foreground" data-testid="text-lessons-completed">
            {completedCount} of {totalCount} modules passed (quizzes)
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search lessons..."
            className="pl-9"
            data-testid="input-search-lessons"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {filteredModules.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2">
            No lessons match “{searchQuery}”.
          </div>
        ) : (
          filteredModules.map((module) => (
            <div
              key={module.id}
              className="course-player-module rounded-2xl border backdrop-blur"
            >
              <Collapsible
                open={expandedModules.has(module.id)}
                onOpenChange={() => toggleModule(module.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex items-start gap-3 p-4 text-left font-semibold hover:bg-accent/50 transition-colors"
                  >
                    <span className="flex-1 text-left leading-snug break-words whitespace-normal">
                      {module.title}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 flex-shrink-0 mt-1 transition-transform data-[state=open]:rotate-90"
                      data-state={expandedModules.has(module.id) ? 'open' : 'closed'}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-2 pb-3 space-y-1.5">
                    {module.lessons.map((lesson) => (
                      <Button
                        key={lesson.id}
                        variant={lesson.current ? 'secondary' : 'ghost'}
                        className={`w-full justify-start p-3 h-auto min-h-[72px] transition-all duration-200 group rounded-lg ${
                          lesson.current ? 'bg-primary/10 border border-primary/20 shadow-sm' : ''
                        } ${lesson.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!lesson.locked) {
                            onLessonSelect(lesson.slug);
                          }
                        }}
                        disabled={lesson.locked}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleLessonComplete?.(lesson.id, !lesson.completed);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onToggleLessonComplete?.(lesson.id, !lesson.completed);
                              }
                            }}
                            aria-label={
                              lesson.completed
                                ? 'Mark lesson as incomplete'
                                : 'Mark lesson as complete'
                            }
                            aria-pressed={lesson.completed}
                            disabled={!onToggleLessonComplete || lesson.locked}
                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                              lesson.completed
                                ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 text-emerald-500 hover:scale-105'
                                : lesson.current
                                ? 'bg-gradient-to-br from-primary/25 to-primary/10 border-primary/50 text-primary hover:scale-105'
                                : 'bg-gradient-to-br from-muted/40 to-muted/20 border-muted-foreground/15 text-muted-foreground/70 hover:scale-105'
                            } ${onToggleLessonComplete ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
                          >
                            {lesson.completed ? (
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                            ) : lesson.current ? (
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0 text-left">
                            <p
                              className={`text-xs sm:text-sm font-medium leading-relaxed group-hover:text-primary transition-colors whitespace-normal ${
                                lesson.current ? 'text-primary' : 'text-foreground'
                              }`}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                  {lesson.duration}
                                </span>
                              </div>
                              {lesson.locked && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-muted border-muted text-muted-foreground flex items-center gap-1 whitespace-nowrap"
                                >
                                  <Lock className="w-3 h-3" />
                                  Locked
                                </Badge>
                              )}
                              {lesson.isPreview && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 bg-primary/5 border-primary/30 text-primary whitespace-nowrap"
                                >
                                  Free
                                </Badge>
                              )}
                            </div>
                            {lesson.current && lesson.progress && lesson.progress > 0 && (
                              <div className="mt-2">
                                <div className="w-full bg-secondary/50 rounded-full h-1">
                                  <div
                                    className="bg-primary h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${lesson.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))
        )}
      </div>

      <div className="px-6 py-4 border-t border-sidebar-border text-xs text-muted-foreground">
        {completedCount} of {totalCount} modules counted toward progress
      </div>
    </div>
  );
}
