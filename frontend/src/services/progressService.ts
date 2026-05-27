import { Course } from '../types';
import { supabase } from '../lib/supabaseClient';

type CourseRow = {
  id: string;
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
    .select('id,source_course_id,payload,updated_at')
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

const syncCourseStructureToDb = async (userId: string, courseRowId: string, course: Course): Promise<void> => {
  const moduleRows = course.modules.map((module, moduleIdx) => ({
    course_id: courseRowId,
    user_id: userId,
    source_module_id: module.id,
    module_order: moduleIdx,
    title: module.title,
    description: module.description,
    updated_at: new Date().toISOString(),
  }));

  const { data: upsertedModules, error: modulesError } = await supabase
    .from('course_modules')
    .upsert(moduleRows, { onConflict: 'course_id,source_module_id' })
    .select('id,source_module_id');

  if (modulesError) throw modulesError;

  const moduleIdBySource = new Map<string, string>();
  (upsertedModules || []).forEach((row: { id: string; source_module_id: string | null }) => {
    if (row.source_module_id) moduleIdBySource.set(row.source_module_id, row.id);
  });

  const lessonRows = course.modules.flatMap((module) => {
    const moduleDbId = moduleIdBySource.get(module.id);
    if (!moduleDbId) return [];
    return module.lessons.map((lesson, lessonIdx) => ({
      module_id: moduleDbId,
      course_id: courseRowId,
      user_id: userId,
      source_lesson_id: lesson.id,
      lesson_order: lessonIdx,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content || null,
      is_completed: lesson.isCompleted,
      is_locked: lesson.isLocked,
      completed_at: lesson.isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }));
  });

  if (lessonRows.length === 0) return;

  const { error: lessonsError } = await supabase
    .from('module_lessons')
    .upsert(lessonRows, { onConflict: 'course_id,source_lesson_id' });

  if (lessonsError) throw lessonsError;
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
    await syncCourseStructureToDb(userId, existing.data.id, course);
    return;
  }

  const { data: created, error } = await supabase.from('courses').insert({
    user_id: userId,
    title: course.title,
    description: course.description,
    source_course_id: course.id,
    payload: course,
    created_at: nowIso,
    updated_at: nowIso,
  }).select('id').single();
  if (error) throw error;
  await syncCourseStructureToDb(userId, created.id, course);
};

export const recordQuizOutcome = async (
  courseSourceId: string,
  lessonSourceId: string,
  score: number,
  totalQuestions: number,
  passed: boolean,
  quizPayload: unknown
): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return;

  const { data: courseRow, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('user_id', userId)
    .eq('source_course_id', courseSourceId)
    .maybeSingle();
  if (courseError || !courseRow?.id) return;

  const { data: lessonRow, error: lessonError } = await supabase
    .from('module_lessons')
    .select('id')
    .eq('course_id', courseRow.id)
    .eq('source_lesson_id', lessonSourceId)
    .maybeSingle();
  if (lessonError || !lessonRow?.id) return;

  const normalizedScore = totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;
  const nowIso = new Date().toISOString();

  await supabase.from('quiz_attempts').insert({
    user_id: userId,
    lesson_id: lessonRow.id,
    quiz_payload: quizPayload || {},
    score: normalizedScore,
    passed,
    created_at: nowIso,
  });

  await supabase.from('lesson_attempts').insert({
    user_id: userId,
    lesson_id: lessonRow.id,
    status: passed ? 'passed' : 'failed',
    score: normalizedScore,
    created_at: nowIso,
  });
};
