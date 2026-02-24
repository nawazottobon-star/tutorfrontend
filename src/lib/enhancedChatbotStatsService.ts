import { apiRequest } from './queryClient';

export interface PerLearnerStats {
    userId: string;
    userName: string;
    userEmail: string;
    totalSessions: number;
    totalQuestions: number;
    predefinedCount: number;
    customCount: number;
    predefinedPercentage: number;
    customPercentage: number;
    mostActiveModule: string | null;
    lastActivityAt: string | null;
}

export interface CustomQuestion {
    questionText: string;
    topicName: string;
    moduleName: string;
    askedAt: string;
}

export interface ModuleActivity {
    moduleNo: number;
    moduleName: string;
    totalSessions: number;
    totalQuestions: number;
    customQuestionCount: number;
    customQuestionPercentage: number;
}

/**
 * Fetch per-learner chatbot statistics
 */
export async function fetchPerLearnerStats(
    courseId: string,
    cohortId?: string,
    headers?: Headers
): Promise<PerLearnerStats[]> {
    const url = `/api/tutors/${courseId}/chatbot-stats/learners${cohortId ? `?cohortId=${cohortId}` : ''}`;

    const response = await apiRequest(
        'GET',
        url,
        undefined,
        headers ? { headers } : undefined
    );

    const data = await response.json();
    return data.learners || [];
}

/**
 * Fetch custom questions for a specific learner
 */
export async function fetchLearnerCustomQuestions(
    courseId: string,
    learnerId: string,
    cohortId?: string,
    headers?: Headers
): Promise<CustomQuestion[]> {
    const url = `/api/tutors/${courseId}/chatbot-stats/learners/${learnerId}/custom-questions${cohortId ? `?cohortId=${cohortId}` : ''}`;

    const response = await apiRequest(
        'GET',
        url,
        undefined,
        headers ? { headers } : undefined
    );

    const data = await response.json();
    return data.questions || [];
}

/**
 * Fetch module activity overview
 */
export async function fetchModuleActivityOverview(
    courseId: string,
    cohortId?: string,
    headers?: Headers
): Promise<ModuleActivity[]> {
    const url = `/api/tutors/${courseId}/chatbot-stats/modules${cohortId ? `?cohortId=${cohortId}` : ''}`;

    const response = await apiRequest(
        'GET',
        url,
        undefined,
        headers ? { headers } : undefined
    );

    const data = await response.json();
    return data.modules || [];
}
