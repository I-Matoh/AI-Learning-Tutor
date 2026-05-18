import { Course, Quiz } from '../types';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ENABLE_CLIENT_FALLBACK = import.meta.env.VITE_ENABLE_CLIENT_GENERATION_FALLBACK === 'true';

const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Authentication required. Please sign in.');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const generateCourseViaApi = async (topic: string, skillLevel?: 'beginner' | 'intermediate' | 'advanced'): Promise<Course> => {
  const response = await fetch(`${API_BASE_URL}/api/generate/course`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ topic, skillLevel }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || 'Failed to generate course.';
    throw new Error(message);
  }

  return payload.data as Course;
};

export const generateLessonViaApi = async (
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  previousLessons: string[] = []
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/generate/lesson`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ courseTitle, moduleTitle, lessonTitle, previousLessons }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || 'Failed to generate lesson.';
    throw new Error(message);
  }

  return payload?.data?.content || '';
};

export const generateQuizViaApi = async (
  courseTitle: string,
  context: string,
  lessonContent?: string
): Promise<Quiz> => {
  const response = await fetch(`${API_BASE_URL}/api/generate/quiz`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ courseTitle, context, lessonContent }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || 'Failed to generate quiz.';
    throw new Error(message);
  }

  return payload.data as Quiz;
};

export { ENABLE_CLIENT_FALLBACK };
