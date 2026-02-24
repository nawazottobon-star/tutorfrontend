import { useMemo, type ComponentPropsWithoutRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CheckCircle, BookOpen, Loader2, Sparkles } from 'lucide-react';

interface LessonTabsProps {
  guideContent?: string;
  onToggleComplete: (nextCompletedState: boolean) => void;
  isCompleted?: boolean;
  isUpdating?: boolean;
}

const DEFAULT_GUIDE = '# Lesson Guide\n\nThis lesson does not include a guide yet. Please check back later.';

export default function LessonTabs({
  guideContent,
  onToggleComplete,
  isCompleted = false,
  isUpdating = false,
}: LessonTabsProps) {
  const normalizedGuideContent = useMemo(() => {
    const raw = (guideContent ?? '').trim();
    if (!raw) {
      return DEFAULT_GUIDE;
    }

    if (/#\s|<h[1-6]/i.test(raw)) {
      return raw;
    }

    const lines = raw.split(/\r?\n/).map((line) => line.trim());
    if (lines.length === 0) {
      return DEFAULT_GUIDE;
    }

    const bulletRegex = /^[-*\u2022]\s+/;
    const transformed: string[] = [];

    lines.forEach((line, index) => {
      if (!line) {
        transformed.push('');
        return;
      }

      if (bulletRegex.test(line)) {
        transformed.push(line.replace(bulletRegex, '- '));
        return;
      }

      const looksLikeHeading = /^[A-Z0-9].*$/.test(line) && line.split(' ').length <= 12;
      const endsWithColon = /[:：]$/.test(line);

      if (index === 0) {
        transformed.push(`# ${line}`);
      } else if (looksLikeHeading && endsWithColon) {
        transformed.push(`### ${line.replace(/[:：]$/, '').trim()}`);
      } else if (looksLikeHeading) {
        transformed.push(`## ${line}`);
      } else {
        transformed.push(line);
      }
    });

    const result = transformed.join('\n\n').trim();
    return result.length > 0 ? result : DEFAULT_GUIDE;
  }, [guideContent]);

  const markdownComponents: Components = {
    h1: (props) => (
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-6 first:mt-0" {...props} />
    ),
    h2: (props) => (
      <h2 className="text-2xl font-semibold tracking-tight text-foreground mt-8 mb-4" {...props} />
    ),
    h3: (props) => (
      <h3 className="text-xl font-semibold text-foreground mt-6 mb-3" {...props} />
    ),
    p: (props) => (
      <p className="text-lg text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap" {...props} />
    ),
    ul: (props) => (
      <ul className="list-disc pl-7 space-y-2 text-lg text-foreground/90" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal pl-7 space-y-2 text-lg text-foreground/90" {...props} />
    ),
    li: (props) => <li className="leading-relaxed" {...props} />,
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    em: (props) => <em className="italic text-foreground/90" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-4 border-primary/50 pl-4 italic text-foreground/80 bg-primary/5 rounded-r-md py-2"
        {...props}
      />
    ),
    code: ({ inline, ...props }: { inline?: boolean } & ComponentPropsWithoutRef<'code'>) =>
      inline ? (
        <code className="rounded-md bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground/90" {...props} />
      ) : (
        <code className="block rounded-lg bg-muted px-4 py-3 text-sm leading-relaxed text-foreground/90" {...props} />
      ),
    table: (props) => (
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-sm" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground" {...props} />
    ),
    td: (props) => <td className="px-3 py-2 text-foreground/90" {...props} />
  };

  return (
    <div className="w-full" data-testid="container-lesson-tabs">
      <Tabs defaultValue="quiz" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto p-0 bg-transparent border-b border-border" data-testid="tabs-lesson-content">
          <TabsTrigger
            value="quiz"
            data-testid="tab-guide"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4 justify-start gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold">Lesson Guide</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quiz" data-testid="content-guide" className="mt-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Study Material
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Read through the key concepts and notes
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
                <ScrollArea className="h-[400px] sm:h-[450px] lg:h-[500px]">
                  <div className="p-6 sm:p-8">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                        components={markdownComponents}
                      >
                        {normalizedGuideContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {!isCompleted && (
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Complete this lesson
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Mark as complete once you've reviewed all the material
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 lg:mt-8 flex justify-center px-4 lg:px-0">
        <Button
          onClick={() => onToggleComplete(!isCompleted)}
          size="lg"
          disabled={isUpdating}
          className="w-full sm:w-auto sm:min-w-64 h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-wait"
          data-testid="button-mark-complete"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>Updating...</span>
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
              <span>Mark as Incomplete</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Mark as Complete</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

