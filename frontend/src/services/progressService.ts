import { Course } from '../types';
import { supabase } from '../lib/supabaseClient';

type CourseRow = {
  source_course_id: string | null;
  payload: unknown;
  updated_at: string;
};

const STORAGE_KEY = 'edupath_courses';

export const loadCoursesFromCache = (): Course[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Course[]) : [];
  } catch {
    return [];
  }
};

export const saveCoursesToCache = (courses: Course[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
};

export const loadCoursesFromDb = async (): Promise<Course[]> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return loadCoursesFromCache();

  const { data, error } = await supabase
    .from('courses')
    .select('source_course_id,payload,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to load courses from DB', error);
    return loadCoursesFromCache();
  }

  const mapped = ((data || []) as CourseRow[])
    .map((row) => row.payload)
    .filter((payload): payload is Course => {
      return typeof payload === 'object' && payload !== null && 'id' in payload && 'modules' in payload;
    });

  saveCoursesToCache(mapped);
  return mapped;
};

export const persistCourseToDb = async (course: Course): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error('Authentication required to save progress.');
  }

  const nowIso = new Date().toISOString();
  const existing = await supabase
    .from('courses')
    .select('id')
    .eq('user_id', userId)
    .eq('source_course_id', course.id)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.id) {
    const { error } = await supabase
      .from('courses')
      .update({
        title: course.title,
        description: course.description,
        payload: course,
        updated_at: nowIso,
      })
      .eq('id', existing.data.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('courses').insert({
    user_id: userId,
    title: course.title,
    description: course.description,
    source_course_id: course.id,
    payload: course,
    created_at: nowIso,
    updated_at: nowIso,
  });
  if (error) throw error;
};

