import React, { useEffect, useState } from 'react';
import { Course, Lesson, Quiz } from '../../types';
import { Icons } from '../../components/icons';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { BrandLogo } from '../../components/BrandLogo';
import { SyncStatus } from '../../components/SyncStatus';
import { generateLessonViaApi, generateQuizViaApi } from '../../services/apiService';
import { QuizModal } from '../quiz/QuizModal';

type DashboardProps = { 
  course: Course; 
  onUpdateCourse: (course: Course) => Promise<void>; 
  onBack: () => void 
};

/**
 * Dashboard Component
 * 
 * Main learning interface displaying:
 * - Course structure with modules and lessons
 * - Lesson content viewer
 * - Progress tracking
 * - Quiz functionality
 */
export const Dashboard: React.FC<DashboardProps> = ({ course: initialCourse, onUpdateCourse, onBack }) => {
  // Local course state for optimistic updates
  const [course, setCourseState] = useState<Course>(initialCourse);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  /**
   * Helper to update course state and propagate to parent.
   */
  const setCourse = (newCourse: Course | ((prev: Course) => Course)) => {
    setCourseState(prev => {
      const updated = typeof newCourse === 'function' ? newCourse(prev) : newCourse;
      setSyncState('saving');
      void onUpdateCourse(updated)
        .then(() => {
          setLastSavedAt(Date.now());
          setSyncState('saved');
        })
        .catch((error) => {
          console.error('Sync failed', error);
          setSyncState('failed');
        });
      return updated;
    });
  };

  const retrySync = () => {
    setCourse((prev) => ({ ...prev }));
  };
  
  // Loading states
  const [loadingLesson, setLoadingLesson] = useState(false);
  
  // Content cache to avoid re-fetching lessons
  const [contentCache, setContentCache] = useState<Record<string, string>>({});
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  
  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize with first unlocked lesson on mount
  useEffect(() => {
    if (!activeLesson) {
      let targetModule = course.modules[0];
      let targetLesson = targetModule?.lessons[0];

      // Find first uncompleted and unlocked lesson
      for (const m of course.modules) {
        const uncompleted = m.lessons.find(l => !l.isCompleted && !l.isLocked);
        if (uncompleted) {
          targetModule = m;
          targetLesson = uncompleted;
          break;
        }
      }

      if (targetLesson) {
        handleSelectLesson(targetModule.id, targetLesson);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Finds the module and lesson for a given lesson ID.
   */
  const getModuleAndLesson = (lessonId: string) => {
    for(const m of course.modules) {
      const l = m.lessons.find(lx => lx.id === lessonId);
      if(l) return { module: m, lesson: l };
    }
    return null;
  };

  /**
   * Handles lesson selection - loads content if not cached.
   */
  const handleSelectLesson = async (moduleId: string, lesson: Lesson) => {
    if (lesson.isLocked) return;

    setActiveLesson(lesson);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) setSidebarOpen(false);

    // Check cache - don't re-fetch if already loaded
    if (lesson.content || contentCache[lesson.id]) {
      return;
    }

    setLoadingLesson(true);
    try {
      const module = course.modules.find(m => m.id === moduleId)!;
      
      // Get previous lessons in this module for context (avoid repetition)
      const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
      const previousLessons = module.lessons
        .slice(0, currentLessonIndex)
        .map(l => l.title);
      
      // Generate lesson content via AI with previous lesson context
      const content = await generateLessonViaApi(
        course.title, 
        module.title, 
        lesson.title, 
        previousLessons
      );
      setContentCache(prev => ({ ...prev, [lesson.id]: content }));
      
      // Update course state to persist content
      setCourse(prev => ({
        ...prev,
        modules: prev.modules.map(m => 
          m.id === moduleId ? {
            ...m,
            lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, content } : l)
          } : m
        )
      }));

    } catch (error) {
      console.error("Failed to load lesson", error);
    } finally {
      setLoadingLesson(false);
    }
  };

  /**
   * Initiates quiz generation and displays quiz modal.
   */
  const handleStartQuiz = async () => {
    if (!activeLesson) return;
    setLoadingQuiz(true);
    try {
      const info = getModuleAndLesson(activeLesson.id);
      if(!info) return;

      // Generate quiz with actual lesson content for precise questions
      const quiz = await generateQuizViaApi(
        course.title, 
        info.lesson.title,
        info.lesson.content // Pass lesson content for better questions
      );
      setQuizData(quiz);
      setShowQuiz(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuiz(false);
    }
  };

  /**
   * Handles lesson completion - marks complete and unlocks next.
   */
  const handleLessonComplete = () => {
    setShowQuiz(false);
    setQuizData(null);
    if(!activeLesson) return;

    // Mark current as completed and unlock next lesson
    let foundCurrent = false;
    let nextLessonToUnlock: Lesson | null = null;
    let nextModuleId: string | null = null;

    const newModules = course.modules.map(m => {
      const newLessons = m.lessons.map(l => {
        if (l.id === activeLesson.id) {
          foundCurrent = true;
          return { ...l, isCompleted: true };
        }
        // Unlock first locked lesson after current
        if (foundCurrent && !nextLessonToUnlock && l.isLocked) {
          nextLessonToUnlock = l;
          nextModuleId = m.id;
          return { ...l, isLocked: false };
        }
        return l;
      });
      return { ...m, lessons: newLessons };
    });

    // If no next lesson found in same module, search subsequent modules
    if (foundCurrent && !nextLessonToUnlock) {
      let passedCurrent = false;
      for(let i = 0; i < newModules.length; i++) {
        for(let j = 0; j < newModules[i].lessons.length; j++) {
          const l = newModules[i].lessons[j];
          if(l.id === activeLesson.id) passedCurrent = true;
          if(passedCurrent && l.isLocked) {
            newModules[i].lessons[j].isLocked = false;
            nextLessonToUnlock = newModules[i].lessons[j];
            nextModuleId = newModules[i].id;
            i = newModules.length; // Break outer loop
            break;
          }
        }
      }
    }

    // Update state and persist via parent save flow
    const updatedCourse = { ...course, modules: newModules };
    setCourse(updatedCourse);
  };

  // Get active content from cache or lesson
  const activeContent = activeLesson ? (contentCache[activeLesson.id] || activeLesson.content) : null;
  // Find current module for breadcrumb
  const currentModule = activeLesson ? course.modules.find(m => m.lessons.some(l => l.id === activeLesson.id)) : null;

  // Calculate overall progress
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0);
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);
  const copyrightYear = new Date().getFullYear();

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile menu button */}
      {!sidebarOpen && (
        <div className="md:hidden fixed z-20 top-4 left-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white shadow-md rounded-md border border-slate-200">
            <Icons.Menu className="w-6 h-6 text-slate-700"/>
          </button>
        </div>
      )}

      {/* Sidebar - course navigation */}
      <aside 
        className={`
          fixed md:relative z-30 w-80 h-full bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-indigo-700 font-bold text-xl hover:opacity-80 transition-opacity text-left">
            <BrandLogo className="h-9 w-auto rounded-md shrink-0" />
            <span>Learn AI</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500">
            <Icons.X className="w-5 h-5"/>
          </button>
        </div>

        {/* Course info with progress */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Course</h2>
          <h1 className="font-bold text-slate-900 leading-tight mb-3">{course.title}</h1>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 text-right">{progressPercent}% Complete</p>
        </div>

        {/* Module and lesson list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {course.modules.map((module, mIdx) => (
            <div key={module.id}>
              <div className="flex items-start gap-3 mb-3 px-2">
                {/* Module number indicator */}
                <div className="flex flex-col items-center mt-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200">
                    {mIdx + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{module.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{module.description}</p>
                </div>
              </div>
              
              {/* Lesson list with timeline connector */}
              <div className="space-y-1 ml-3 border-l-2 border-slate-200 pl-4 py-1">
                {module.lessons.map((lesson, lIdx) => {
                  const isActive = activeLesson?.id === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(module.id, lesson)}
                      disabled={lesson.isLocked}
                      className={`
                        w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group
                        ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}
                        ${lesson.isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        {/* Status icon */}
                        {lesson.isCompleted ? (
                          <Icons.CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : lesson.isLocked ? (
                          <Icons.Lock className="w-3 h-3 shrink-0" />
                        ) : (
                          <Icons.Circle className={`w-3 h-3 shrink-0 ${isActive ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </div>
                      {isActive && <Icons.ChevronRight className="w-4 h-4 opacity-50" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-4 pb-2 text-xs">
          <SyncStatus syncState={syncState} lastSavedAt={lastSavedAt} onRetry={retrySync} />
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 text-xs text-center text-slate-500">
          Copyright © {copyrightYear} Learn AI. All rights reserved.
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 h-full overflow-y-auto relative bg-white">
        {activeLesson ? (
          <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
            {/* Lesson header with breadcrumb */}
            <div className="mb-8 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-2">
                <span className="uppercase tracking-wide">{currentModule?.title}</span>
                <Icons.ChevronRight className="w-4 h-4" />
                <span>Lesson {course.modules.findIndex(m => m.id === currentModule?.id) + 1}.{currentModule?.lessons.findIndex(l => l.id === activeLesson.id) + 1}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{activeLesson.title}</h1>
              <p className="text-lg text-slate-600">{activeLesson.description}</p>
            </div>

            {/* Lesson content */}
            <div className="min-h-[300px]">
              {loadingLesson ? (
                // Loading skeleton
                <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                  <p className="text-slate-500 font-medium">Writing your lesson...</p>
                </div>
              ) : (
                // Rendered markdown content
                <div className="prose prose-slate prose-lg max-w-none">
                  <MarkdownRenderer content={activeContent || ''} />
                </div>
              )}
            </div>

            {/* Footer with completion action */}
            {!loadingLesson && (
              <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-slate-500 text-sm">
                  {activeLesson.isCompleted ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <Icons.CheckCircle className="w-5 h-5" /> Completed
                    </span>
                  ) : (
                    <span>Complete this lesson to unlock the next one.</span>
                  )}
                </div>
                <button
                  onClick={handleStartQuiz}
                  disabled={loadingQuiz}
                  className={`
                    px-8 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2
                    ${activeLesson.isCompleted 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'}
                  `}
                >
                  {loadingQuiz ? (
                    <Icons.RefreshCw className="animate-spin w-5 h-5" />
                  ) : (
                    <Icons.Play className="w-5 h-5 fill-current" />
                  )}
                  {activeLesson.isCompleted ? 'Retake Quiz' : 'Take Quiz to Complete'}
                </button>
              </div>
            )}
          </div>
        ) : (
          // Empty state
          <div className="flex items-center justify-center h-full text-slate-400">
            Select a lesson to begin
          </div>
        )}
      </main>
      
      {/* Quiz modal */}
      {showQuiz && quizData && (
        <QuizModal 
          quiz={quizData} 
          onClose={() => setShowQuiz(false)} 
          onPass={handleLessonComplete} 
        />
      )}
    </div>
  );
};

// =============================================================================
