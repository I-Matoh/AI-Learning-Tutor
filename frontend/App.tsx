import React, { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Analytics } from '@vercel/analytics/react';
import { Course } from './src/types';
import { supabase } from './src/lib/supabaseClient';
import { loadCoursesFromDb, loadCoursesFromCache, saveCoursesToCache, persistCourseToDb } from './src/services/progressService';
import { generateCourseViaApi } from './src/services/apiService';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { AuthModal } from './src/features/auth/AuthModal';
import { Dashboard } from './src/features/course-map/Dashboard';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [courseData, setCourseData] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const savedCoursesRef = useRef<Course[]>([]);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setSavedCourses(loadCoursesFromCache());
  }, []);

  useEffect(() => {
    savedCoursesRef.current = savedCourses;
  }, [savedCourses]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        if (data.session) {
          const remoteCourses = await loadCoursesFromDb();
          if (mounted) setSavedCourses(remoteCourses);
        }
        setAuthLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setCourseData(null);
        setSavedCourses(loadCoursesFromCache());
      } else {
        void loadCoursesFromDb().then((remoteCourses) => {
          setSavedCourses(remoteCourses);
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const saveCourse = async (updatedCourse: Course) => {
    setCourseData(updatedCourse);
    const prev = savedCoursesRef.current;
    const existingIdx = prev.findIndex((c) => c.id === updatedCourse.id);
    const nextCourses =
      existingIdx >= 0
        ? [...prev.slice(0, existingIdx), updatedCourse, ...prev.slice(existingIdx + 1)]
        : [updatedCourse, ...prev];
    setSavedCourses(nextCourses);
    saveCoursesToCache(nextCourses);
    await persistCourseToDb(updatedCourse);
  };

  const runStart = async (topic: string, skillLevel?: 'beginner' | 'intermediate' | 'advanced') => {
    setLoading(true);
    try {
      const course = await generateCourseViaApi(topic, skillLevel);
      await saveCourse(course);
    } catch (error) {
      console.error('Error generating course:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate course. Please try again with a different topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (topic: string, skillLevel?: 'beginner' | 'intermediate' | 'advanced') => {
    if (!session) {
      setPendingTopic(topic);
      setAuthModalOpen(true);
      if (skillLevel) localStorage.setItem('pendingSkillLevel', skillLevel);
      return;
    }
    await runStart(topic, skillLevel);
  };

  const handleResume = (course: Course) => {
    if (!session) {
      setAuthModalOpen(true);
      return;
    }
    setCourseData(course);
  };

  const handleBackToHome = () => {
    setCourseData(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthenticated = () => {
    if (pendingTopic) {
      const topic = pendingTopic;
      const skillLevel = localStorage.getItem('pendingSkillLevel') as 'beginner' | 'intermediate' | 'advanced' | null;
      setPendingTopic(null);
      localStorage.removeItem('pendingSkillLevel');
      void runStart(topic, skillLevel || undefined);
    }
  };

  if (!courseData) {
    return (
      <>
        <OnboardingScreen
          onStart={handleStart}
          loading={loading}
          savedCourses={savedCourses}
          onResume={handleResume}
          session={session}
          authLoading={authLoading}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={handleAuthenticated}
        />
        <Analytics />
      </>
    );
  }

  return (
    <>
      <Dashboard course={courseData} onUpdateCourse={saveCourse} onBack={handleBackToHome} />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
      <Analytics />
    </>
  );
}
