export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  price: number;
  priceCents: number;
  category?: string;
  level?: string;
  instructor?: string;
  durationLabel?: string;
  durationMinutes?: number;
  rating?: number;
  students?: number;
  thumbnail?: string | null;
  heroVideoUrl?: string | null;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseListResponse {
  courses: CourseSummary[];
}

export type PageContentSections = {
  stats?: Array<{ label: string; value: string }>;
  highlights?: Array<{ title: string; description: string }>;
  values?: Array<{ title: string; description: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  categories?: string[];
  filters?: string[];
  steps?: Array<{ title: string; description: string }>;
  perks?: Array<{ title: string; description: string }>;
  [key: string]: unknown;
};

export interface PageContentEntry {
  slug: string;
  title: string;
  subtitle?: string | null;
  heroImage?: string | null;
  sections: PageContentSections;
  updatedAt?: string;
}

export interface PageContentResponse {
  page: PageContentEntry;
}

export interface TutorApplicationPayload {
  fullName: string;
  email: string;
  phone?: string;
  headline: string;
  courseTitle: string;
  courseDescription: string;
  targetAudience: string;
  expertiseArea: string;
  experienceYears?: number;
  availability: string;
}

export interface TutorApplicationResponse {
  application: {
    id: string;
    status: string;
    submittedAt: string;
  };
}

// Course interface for API responses
export interface Course {
  id: string;
  title: string;
  description: string;
  slug?: string;
  price?: number;
  priceCents?: number;
  category?: string;
  level?: string;
  difficulty?: string;
  instructor?: string;
  duration?: string;
  durationLabel?: string;
  durationMinutes?: number;
  rating?: number;
  studentsCount: number;
  thumbnail?: string | null;
  heroVideoUrl?: string | null;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Assessment question interface
export interface AssessmentQuestion {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }>;
  courseId?: string;
  order?: number;
}
