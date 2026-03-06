import React, { useState, useEffect, useRef } from 'react';
import { generateCourse, generateLessonContent, generateQuiz } from './services/groqService';
import { Course, Module, Lesson, Quiz } from './types';
import { Icons } from './components/icons';
import { MarkdownRenderer } from './components/MarkdownRenderer';

// --- Components ---

// 1. Onboarding Screen
const Onboarding: React.FC<{ 
  onStart: (topic: string) => void; 
  loading: boolean;
  savedCourses: Course[];
  onResume: (course: Course) => void;
}> = ({ onStart, loading, savedCourses, onResume }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onStart(topic);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4">
            <Icons.BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            What do you want to <span className="text-indigo-600">master</span> today?
          </h1>
          <p className="text-lg text-slate-600">
            Enter a topic, and our AI will build a personalized curriculum just for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Quantum Physics, French History, React Hooks..."
            className="w-full px-6 py-4 text-lg rounded-full border-2 border-transparent shadow-lg focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Icons.RefreshCw className="animate-spin w-5 h-5" /> : <Icons.Sparkles className="w-5 h-5" />}
            {loading ? 'Building...' : 'Start'}
          </button>
        </form>
        
        <div className="flex justify-center gap-4 text-sm text-slate-500">
          <span>Try: "Digital Marketing"</span>
          <span>•</span>
          <span>"Python for Beginners"</span>
          <span>•</span>
          <span>"Renaissance Art"</span>
        </div>

        {savedCourses.length > 0 && (
          <div className="mt-12 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Icons.Play className="w-5 h-5 text-indigo-600" />
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedCourses.map(course => {
                const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                const completedLessons = course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0);
                const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

                return (
                  <button 
                    key={course.id}
                    onClick={() => onResume(course)}
                    className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-white/50 text-left flex flex-col gap-2 group"
                  >
                    <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 flex-1">{course.description}</p>
                    <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{progressPercent}% Complete</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Quiz Modal
const QuizModal: React.FC<{ quiz: Quiz; onClose: () => void; onPass: () => void }> = ({ quiz, onClose, onPass }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQ = quiz.questions[currentQuestionIdx];

  const handleAnswer = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);
    if (optionIdx === currentQ.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const passed = score >= Math.ceil(quiz.questions.length * 0.7); // 70% pass rate

  if (showResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${passed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {passed ? <Icons.Award className="w-8 h-8" /> : <Icons.RefreshCw className="w-8 h-8" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">{passed ? 'Module Complete!' : 'Try Again'}</h2>
            <p className="text-slate-600 mb-6">
                You scored {score} out of {quiz.questions.length}. {passed ? 'Great job mastering this section.' : 'Review the material and try again to unlock the next step.'}
            </p>
            <div className="flex gap-3 justify-center">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium">
                    Close
                </button>
                {passed ? (
                     <button onClick={onPass} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium">
                        Continue Learning
                    </button>
                ) : (
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium">
                        Review Lesson
                    </button>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Knowledge Check</h3>
            <p className="text-sm text-slate-500">Question {currentQuestionIdx + 1} of {quiz.questions.length}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-lg font-medium text-slate-900 mb-6">{currentQ.question}</p>
          
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              let style = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
              if (isAnswered) {
                if (idx === currentQ.correctAnswerIndex) style = "border-green-500 bg-green-50 text-green-900";
                else if (idx === selectedOption) style = "border-red-500 bg-red-50 text-red-900";
                else style = "border-slate-100 opacity-50";
              } else if (idx === selectedOption) {
                style = "border-indigo-600 bg-indigo-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                         isAnswered && idx === currentQ.correctAnswerIndex ? 'border-green-600 bg-green-600 text-white' : 'border-current'
                    }`}>
                        {isAnswered && idx === currentQ.correctAnswerIndex ? <Icons.CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>}
                    </div>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                <span className="font-bold">Explanation: </span>
                {currentQ.explanation}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button 
                onClick={handleNext} 
                disabled={!isAnswered}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {currentQuestionIdx === quiz.questions.length - 1 ? 'Finish' : 'Next Question'}
                <Icons.ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};

// 3. Main Dashboard
const Dashboard: React.FC<{ course: Course; onUpdateCourse: (course: Course) => void; onBack: () => void }> = ({ course: initialCourse, onUpdateCourse, onBack }) => {
  const [course, setCourseState] = useState<Course>(initialCourse);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const setCourse = (newCourse: Course | ((prev: Course) => Course)) => {
    setCourseState(prev => {
      const updated = typeof newCourse === 'function' ? newCourse(prev) : newCourse;
      onUpdateCourse(updated);
      return updated;
    });
  };
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize with first unlocked lesson
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

  const getModuleAndLesson = (lessonId: string) => {
      for(const m of course.modules) {
          const l = m.lessons.find(lx => lx.id === lessonId);
          if(l) return { module: m, lesson: l };
      }
      return null;
  }

  const handleSelectLesson = async (moduleId: string, lesson: Lesson) => {
    if (lesson.isLocked) return;

    setActiveLesson(lesson);
    if (window.innerWidth < 768) setSidebarOpen(false); // Close sidebar on mobile on selection

    // Check cache
    if (lesson.content || contentCache[lesson.id]) {
      return;
    }

    setLoadingLesson(true);
    try {
      const module = course.modules.find(m => m.id === moduleId)!;
      const content = await generateLessonContent(course.title, module.title, lesson.title);
      setContentCache(prev => ({ ...prev, [lesson.id]: content }));
      
      // Update course state to persist content (optional, but good for structure)
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

  const handleStartQuiz = async () => {
    if (!activeLesson) return;
    setLoadingQuiz(true);
    try {
       const info = getModuleAndLesson(activeLesson.id);
       if(!info) return;

       // Generate quiz based on current lesson content
       const quiz = await generateQuiz(course.title, `Lesson: ${info.lesson.title}. Content Summary: ${info.lesson.description}`);
       setQuizData(quiz);
       setShowQuiz(true);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingQuiz(false);
    }
  };

  const handleLessonComplete = () => {
      setShowQuiz(false);
      setQuizData(null);
      if(!activeLesson) return;

      // Mark current as completed and unlock next
      let foundCurrent = false;
      let nextLessonToUnlock: Lesson | null = null;
      let nextModuleId: string | null = null;

      const newModules = course.modules.map(m => {
          const newLessons = m.lessons.map(l => {
              if (l.id === activeLesson.id) {
                  foundCurrent = true;
                  return { ...l, isCompleted: true };
              }
              if (foundCurrent && !nextLessonToUnlock && l.isLocked) {
                  nextLessonToUnlock = l;
                  nextModuleId = m.id;
                  return { ...l, isLocked: false };
              }
              return l;
          });
          return { ...m, lessons: newLessons };
      });

      // If we didn't find a next lesson in the same module, search strictly in next modules
      if (foundCurrent && !nextLessonToUnlock) {
          // This logic is slightly simplified; strictly speaking we did the map above.
          // We need to run a second pass or be smarter. 
          // Let's just re-iterate to find the *first* locked lesson after the current completed one.
           let passedCurrent = false;
           for(let i=0; i<newModules.length; i++) {
               for(let j=0; j<newModules[i].lessons.length; j++) {
                   const l = newModules[i].lessons[j];
                   if(l.id === activeLesson.id) passedCurrent = true;
                   if(passedCurrent && l.isLocked) {
                       newModules[i].lessons[j].isLocked = false;
                       nextLessonToUnlock = newModules[i].lessons[j];
                       nextModuleId = newModules[i].id;
                       // Break both loops
                       i = newModules.length; 
                       break;
                   }
               }
           }
      }

      setCourse({ ...course, modules: newModules });

      // If there is a next lesson, navigate to it? Or let user stay?
      // Let's stay but show success.
      if (nextLessonToUnlock && nextModuleId) {
          // Optionally auto-advance:
          // handleSelectLesson(nextModuleId, nextLessonToUnlock);
      }
  };

  const activeContent = activeLesson ? (contentCache[activeLesson.id] || activeLesson.content) : null;
  const currentModule = activeLesson ? course.modules.find(m => m.lessons.some(l => l.id === activeLesson.id)) : null;

  // Calculate Progress
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0);
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile Menu Overlay */}
      {!sidebarOpen && (
          <div className="md:hidden fixed z-20 top-4 left-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white shadow-md rounded-md border border-slate-200">
                  <Icons.Menu className="w-6 h-6 text-slate-700"/>
              </button>
          </div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
            fixed md:relative z-30 w-80 h-full bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-indigo-700 font-bold text-xl hover:opacity-80 transition-opacity text-left">
             <Icons.BookOpen className="w-6 h-6 shrink-0" />
             <span>EduPath</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500">
            <Icons.X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Course</h2>
            <h1 className="font-bold text-slate-900 leading-tight mb-3">{course.title}</h1>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 text-right">{progressPercent}% Complete</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {course.modules.map((module, mIdx) => (
            <div key={module.id}>
              <div className="flex items-start gap-3 mb-3 px-2">
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
        
        <div className="p-4 border-t border-slate-200 text-xs text-center text-slate-400">
             Powered by Google Gemini
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative bg-white">
        {activeLesson ? (
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                
                {/* Header */}
                <div className="mb-8 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-2">
                        <span className="uppercase tracking-wide">{currentModule?.title}</span>
                        <Icons.ChevronRight className="w-4 h-4" />
                        <span>Lesson {course.modules.findIndex(m => m.id === currentModule?.id) + 1}.{currentModule?.lessons.findIndex(l => l.id === activeLesson.id) + 1}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{activeLesson.title}</h1>
                    <p className="text-lg text-slate-600">{activeLesson.description}</p>
                </div>

                {/* Content Body */}
                <div className="min-h-[300px]">
                    {loadingLesson ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-pulse">
                            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                            <p className="text-slate-500 font-medium">Writing your lesson...</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate prose-lg max-w-none">
                            <MarkdownRenderer content={activeContent || ''} />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
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
            <div className="flex items-center justify-center h-full text-slate-400">
                Select a lesson to begin
            </div>
        )}
      </main>
      
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

// Main App Container
export default function App() {
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('edupath_courses');
    if (saved) {
      try {
        setSavedCourses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved courses", e);
      }
    }
  }, []);

  const saveCourse = (updatedCourse: Course) => {
    setCourseData(updatedCourse);
    setSavedCourses(prev => {
      const existingIdx = prev.findIndex(c => c.id === updatedCourse.id);
      let newCourses;
      if (existingIdx >= 0) {
        newCourses = [...prev];
        newCourses[existingIdx] = updatedCourse;
      } else {
        newCourses = [updatedCourse, ...prev];
      }
      localStorage.setItem('edupath_courses', JSON.stringify(newCourses));
      return newCourses;
    });
  };

  const handleStart = async (topic: string) => {
    setLoading(true);
    try {
      const course = await generateCourse(topic);
      saveCourse(course);
    } catch (error) {
      console.error("Error generating course:", error);
      alert("Failed to generate course. Please try again with a different topic.");
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (course: Course) => {
    setCourseData(course);
  };

  const handleBackToHome = () => {
    setCourseData(null);
  };

  if (!courseData) {
    return <Onboarding onStart={handleStart} loading={loading} savedCourses={savedCourses} onResume={handleResume} />;
  }

  return <Dashboard course={courseData} onUpdateCourse={saveCourse} onBack={handleBackToHome} />;
}
