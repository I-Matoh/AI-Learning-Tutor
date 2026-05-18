/**
 * AI Learning Tutor - Main Application
 * 
 * A personalized AI-powered learning platform that generates custom curriculums,
 * lessons, and quizzes based on user learning goals.
 * 
 * Features:
 * - AI-generated course content via Groq API
 * - Sequential lesson progression with quiz-based unlocks
 * - Supabase authentication
 * - Light/dark theme support
 * - Course persistence to localStorage
 */

import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Analytics } from '@vercel/analytics/react';
import { generateCourse } from './src/services/groqService';
import {
  generateCourseViaApi,
  generateLessonViaApi,
  generateQuizViaApi,
  ENABLE_CLIENT_FALLBACK,
} from './src/services/apiService';
import { Course, Module, Lesson, Quiz } from './src/types';
import { Icons } from './src/components/icons';
import { MarkdownRenderer } from './src/components/MarkdownRenderer';
import { supabase } from './src/lib/supabaseClient';

// =============================================================================
// BRAND LOGO COMPONENT
// =============================================================================

/**
 * SVG Brand Logo for the application.
 * Renders the "learn AI" logo with the application branding.
 */
const BrandLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 300 180"
    aria-label="learn AI logo"
    role="img"
    className={className}
  >
    <rect x="20" y="20" width="260" height="140" fill="#25394d" />
    <path d="M150 20 L150 85 L115 85 L115 20 Z" fill="#f6f3ed" />
    <path d="M150 20 L188 20 L188 58 Z" fill="#d9a511" />
    <rect x="108" y="58" width="84" height="5" fill="#f6f3ed" />
    <rect x="108" y="67" width="84" height="5" fill="#f6f3ed" />
    <rect x="108" y="76" width="84" height="5" fill="#f6f3ed" />
    <rect x="126" y="84" width="5" height="31" fill="#f6f3ed" />
    <rect x="136" y="84" width="5" height="31" fill="#f6f3ed" />
    <rect x="146" y="84" width="5" height="31" fill="#f6f3ed" />
    <rect x="156" y="84" width="5" height="31" fill="#f6f3ed" />
    <text x="75" y="140" fontSize="42" fontFamily="Plus Jakarta Sans, sans-serif" fill="#e3b11d">learn AI</text>
  </svg>
);



// =============================================================================
// ONBOARDING SCREEN
// =============================================================================

/**
 * Props for the Onboarding component.
 */
type OnboardingProps = {
  onStart: (topic: string, skillLevel?: 'beginner' | 'intermediate' | 'advanced') => void;
  loading: boolean;
  savedCourses: Course[];
  onResume: (course: Course) => void;
  session: Session | null;
  authLoading: boolean;
  onOpenAuth: () => void;
  onLogout: () => Promise<void>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

/**
 * Skill level options for course generation.
 */
type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string; description: string }[] = [
  { 
    value: 'beginner', 
    label: 'Beginner', 
    description: 'No prior knowledge - start from basics' 
  },
  { 
    value: 'intermediate', 
    label: 'Intermediate', 
    description: 'Some experience - focus on specifics' 
  },
  { 
    value: 'advanced', 
    label: 'Advanced', 
    description: 'Deep knowledge - focus on mastery' 
  },
];

/**
 * Onboarding Screen Component
 * 
 * Entry point for new users. Displays:
 * - Hero section with topic input
 * - Trust indicators (partner logos)
 * - Feature highlights
 * - Saved courses for returning users
 */
const Onboarding: React.FC<OnboardingProps> = ({ 
  onStart, 
  loading, 
  savedCourses, 
  onResume, 
  session, 
  authLoading, 
  onOpenAuth, 
  onLogout, 
  theme, 
  onToggleTheme 
}) => {
  // User's learning topic input
  const [topic, setTopic] = useState('');
  
  // User's skill level selection (default: intermediate)
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  
  // Partner logos for trust indicators
  const partners = ['Coursera', 'OpenAI', 'Red Hat', 'IBM', 'Northwestern University', 'Harvard', 'Princeton', 'Columbia'];
  
  // Partner-specific styling (colors from brand guidelines)
  const partnerStyles: Record<string, { text: string; border: string; bg: string }> = {
    Coursera: { text: '#0056D2', border: '#0056D2', bg: '#EEF4FF' },
    OpenAI: { text: '#111111', border: '#111111', bg: '#F3F3F3' },
    'Red Hat': { text: '#EE0000', border: '#EE0000', bg: '#FFF1F1' },
    IBM: { text: '#0F62FE', border: '#0F62FE', bg: '#EFF4FF' },
    'Northwestern University': { text: '#4E2A84', border: '#4E2A84', bg: '#F4EEFF' },
    Harvard: { text: '#A51C30', border: '#A51C30', bg: '#FFF0F2' },
    Princeton: { text: '#E77500', border: '#E77500', bg: '#FFF4E9' },
    Columbia: { text: '#75AADB', border: '#75AADB', bg: '#EFF8FF' },
  };

  /**
   * Handles form submission to start course generation.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onStart(topic, skillLevel);
  };

  return (
    <div className="min-h-screen lux-bg relative overflow-hidden p-4 md:p-8">
      {/* Decorative background glows */}
      <div className="lux-glow lux-glow-a" />
      <div className="lux-glow lux-glow-b" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header with theme toggle and auth controls */}
        <div className="flex justify-end mb-4 gap-2 flex-wrap">
          <button onClick={onToggleTheme} className="ghost-btn" aria-label="Toggle theme">
            {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          {authLoading ? (
            <span className="text-sm text-slate-600 glass-pill">Loading session...</span>
          ) : session ? (
            <button onClick={() => void onLogout()} className="ghost-btn">
              Logout
            </button>
          ) : (
            <button onClick={onOpenAuth} className="ghost-btn">
              Login / Sign up
            </button>
          )}
        </div>

        {/* Hero section */}
        <section className="hero-shell">
          <div className="space-y-6">
            {/* Logo and tagline */}
            <div className="flex items-center gap-3">
              <BrandLogo className="h-14 w-auto rounded-lg shadow-md" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-white/70 text-xs tracking-[0.14em] uppercase text-slate-600">
              <Icons.Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Precision Learning Design
            </div>
            <h1 className="hero-title text-slate-900">
              What do you want to <span className="text-amber-700">master</span> today?
            </h1>
            <p className="text-slate-600 text-lg md:text-xl max-w-2xl">
              Name one high-value topic. Get a structured path, lessons, and practice in minutes.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="feature-chip">Clear first step</span>
              <span className="feature-chip">Fast feedback loops</span>
              <span className="feature-chip">Compounding skill growth</span>
            </div>

            {/* Topic input form */}
            <div className="max-w-3xl w-full mx-auto">
              <form onSubmit={handleSubmit} className="glass-panel p-2 md:p-3 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2 md:gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Negotiation strategy, Machine Learning ops, High-ticket copywriting"
                  className="w-full min-w-0 px-5 py-4 text-base md:text-lg rounded-2xl border border-slate-200 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all disabled:opacity-50"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  className="gold-btn w-full md:w-64 px-7 py-4 rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-center justify-self-center"
                >
                  {loading ? <Icons.RefreshCw className="animate-spin w-5 h-5" /> : <Icons.Sparkles className="w-5 h-5" />}
                  {loading ? 'Building your path...' : 'Build my learning plan'}
                </button>
              </form>
              
              {/* Skill level selector */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className="text-sm text-slate-600 self-center mr-2">Your level:</span>
                {SKILL_LEVEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSkillLevel(option.value)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      skillLevel === option.value
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-white/70 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    } disabled:opacity-50`}
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest mode notice */}
            {!session && !authLoading && (
              <p className="text-sm text-amber-900 bg-amber-100/80 border border-amber-200 rounded-xl py-2 px-3 max-w-xl">
                Explore the idea instantly. Login or sign up is required only when you access resources and generate your personalized content.
              </p>
            )}

            {/* Suggested topics */}
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <span>Try: "Digital Marketing"</span>
              <span>|</span>
              <span>"Python for Beginners"</span>
              <span>|</span>
              <span>"Renaissance Art"</span>
            </div>

            {/* Trust indicators - partner logos */}
            <div className="max-w-3xl w-full mx-auto">
              <p className="text-center text-sm font-semibold tracking-[0.08em] uppercase text-slate-700 mb-2">
                Trusted Partners
              </p>
              <div className="partner-strip">
                <div className="partner-track">
                  {/* Duplicate partners for infinite scroll effect */}
                  <div className="partner-group">
                    {partners.map((partner) => (
                      <span
                        key={`group-a-${partner}`}
                        className="partner-pill"
                        style={{
                          color: partnerStyles[partner].text,
                          borderColor: partnerStyles[partner].border,
                          backgroundColor: partnerStyles[partner].bg,
                        }}
                      >
                        {partner}
                      </span>
                    ))}
                  </div>
                  <div className="partner-group" aria-hidden="true">
                    {partners.map((partner) => (
                      <span
                        key={`group-b-${partner}`}
                        className="partner-pill"
                        style={{
                          color: partnerStyles[partner].text,
                          borderColor: partnerStyles[partner].border,
                          backgroundColor: partnerStyles[partner].bg,
                        }}
                      >
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value proposition cards */}
          <div className="space-y-3">
            <div className="glass-panel p-5 stagger-in">
              <h3 className="text-slate-900 font-semibold">Why this flow converts quickly</h3>
              <p className="text-sm text-slate-600 mt-2">
                One input, immediate structure, visible progress. Reduced decision friction helps users commit faster.
              </p>
            </div>
            <div className="glass-panel p-5 stagger-in">
              <h3 className="text-slate-900 font-semibold">Your outcome in this session</h3>
              <p className="text-sm text-slate-600 mt-2">
                A complete course map with lesson-by-lesson progression and checks for retention.
              </p>
            </div>
          </div>
        </section>

        {/* Saved courses for returning users */}
        {savedCourses.length > 0 && (
          <div className="mt-10 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Icons.Play className="w-5 h-5 text-amber-700" />
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCourses.map(course => {
                // Calculate progress statistics
                const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                const completedLessons = course.modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0);
                const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

                return (
                  <button
                    key={course.id}
                    onClick={() => onResume(course)}
                    className="glass-panel p-5 text-left flex flex-col gap-2 group hover:-translate-y-1 transition-all duration-300"
                  >
                    <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{course.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 flex-1">{course.description}</p>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-200/70 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{progressPercent}% complete</span>
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

// =============================================================================
// AUTH MODAL
// =============================================================================

/**
 * Props for the AuthModal component.
 */
type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
};

/**
 * Authentication Modal Component
 * 
 * Provides login and signup forms in a modal overlay.
 * Supports switching between login and signup modes.
 */
const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Don't render if modal is closed
  if (!open) return null;

  /**
   * Handles form submission for authentication.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setMessage('');
    setSubmitting(true);

    if (mode === 'signup') {
      // Create new account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      setSubmitting(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If no session returned, user needs to confirm email
      if (!data.session) {
        setMessage('Account created. Check your email to confirm signup.');
        return;
      }

      onAuthenticated();
      onClose();
      return;
    }

    // Login existing user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    onAuthenticated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel p-8 relative border border-white/70">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700"
          aria-label="Close auth dialog"
        >
          <Icons.X className="w-5 h-5" />
        </button>
        
        <BrandLogo className="h-12 w-auto rounded-md shadow-sm mb-3" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs tracking-[0.1em] uppercase border border-amber-200 mb-4">
          Secure Access
        </div>
        
        <h2 className="text-3xl auth-title text-slate-900 mb-1">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Unlock your personal learning resources and generate tailored course content.
        </p>
        
        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoComplete="email"
            disabled={submitting}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-400"
            autoComplete="current-password"
            disabled={submitting}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl gold-btn text-slate-900 py-3 font-semibold disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
          </button>
        </form>
        
        {/* Toggle between login and signup */}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setMessage('');
          }}
          className="w-full mt-4 text-sm text-slate-700 hover:text-slate-900 font-medium"
        >
          {mode === 'login' ? 'No account yet? Sign up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// QUIZ MODAL
// =============================================================================

/**
 * Props for the QuizModal component.
 */
type QuizModalProps = { 
  quiz: Quiz; 
  onClose: () => void; 
  onPass: () => void 
};

/**
 * Quiz Modal Component
 * 
 * Displays a multiple-choice quiz to assess lesson comprehension.
 * Requires 70% score to pass and unlock the next lesson.
 */
const QuizModal: React.FC<QuizModalProps> = ({ quiz, onClose, onPass }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQ = quiz.questions[currentQuestionIdx];

  /**
   * Handles selecting an answer option.
   */
  const handleAnswer = (optionIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIdx);
    setIsAnswered(true);
    // Increment score if correct
    if (optionIdx === currentQ.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  /**
   * Advances to the next question or shows results.
   */
  const handleNext = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  // Pass threshold: 70% correct answers
  const passed = score >= Math.ceil(quiz.questions.length * 0.7);

  // Show results screen
  if (showResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
          {/* Pass/fail icon */}
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

  // Question display
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Knowledge Check</h3>
            <p className="text-sm text-slate-500">Question {currentQuestionIdx + 1} of {quiz.questions.length}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Question content */}
        <div className="p-6 overflow-y-auto">
          <p className="text-lg font-medium text-slate-900 mb-6">{currentQ.question}</p>
          
          {/* Answer options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              // Dynamic styling based on selection and answer state
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
                    {/* Option letter indicator */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isAnswered && idx === currentQ.correctAnswerIndex ? 'border-green-600 bg-green-600 text-white' : 'border-current'
                    }`}>
                      {isAnswered && idx === currentQ.correctAnswerIndex ? (
                        <Icons.CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{String.fromCharCode(65 + idx)}</span>
                      )}
                    </div>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation (shown after answering) */}
          {isAnswered && (
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
              <span className="font-bold">Explanation: </span>
              {currentQ.explanation}
            </div>
          )}
        </div>

        {/* Footer with next button */}
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

// =============================================================================
// MAIN DASHBOARD
// =============================================================================

/**
 * Props for the Dashboard component.
 */
type DashboardProps = { 
  course: Course; 
  onUpdateCourse: (course: Course) => void; 
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
const Dashboard: React.FC<DashboardProps> = ({ course: initialCourse, onUpdateCourse, onBack }) => {
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
      try {
        onUpdateCourse(updated);
        setLastSavedAt(Date.now());
        setSyncState('saved');
      } catch (error) {
        console.error('Sync failed', error);
        setSyncState('failed');
      }
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
          {syncState === 'saving' && <span className="text-amber-700">Saving...</span>}
          {syncState === 'saved' && (
            <span className="text-green-700">
              Saved
              {lastSavedAt ? ` at ${new Date(lastSavedAt).toLocaleTimeString()}` : ''}
            </span>
          )}
          {syncState === 'failed' && (
            <button onClick={retrySync} className="text-red-700 underline">
              Sync failed - retry
            </button>
          )}
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
// MAIN APP CONTAINER
// =============================================================================

/**
 * Main App Component
 * 
 * Root component that manages:
 * - Theme state (light/dark)
 * - Course data and persistence
 * - Authentication state
 * - Navigation between screens
 */
export default function App() {
  // Theme state - defaults to system preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  // Course state
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);

  // Apply theme class to document
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load saved courses from localStorage on mount
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

  // Initialize auth and subscribe to changes
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      // Clear course data when logging out
      if (!currentSession) {
        setCourseData(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Toggles between light and dark theme.
   */
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  /**
   * Saves course to state and localStorage.
   */
  const saveCourse = (updatedCourse: Course) => {
    setCourseData(updatedCourse);
    setSavedCourses(prev => {
      const existingIdx = prev.findIndex(c => c.id === updatedCourse.id);
      let newCourses;
      if (existingIdx >= 0) {
        // Update existing course
        newCourses = [...prev];
        newCourses[existingIdx] = updatedCourse;
      } else {
        // Add new course at beginning
        newCourses = [updatedCourse, ...prev];
      }
      // Persist to localStorage
      localStorage.setItem('edupath_courses', JSON.stringify(newCourses));
      return newCourses;
    });
  };

  /**
   * Generates a new course for the given topic with specified skill level.
   */
  const runStart = async (topic: string, skillLevel?: 'beginner' | 'intermediate' | 'advanced') => {
    setLoading(true);
    try {
      const course = await generateCourseViaApi(topic, skillLevel);
      saveCourse(course);
    } catch (error) {
      console.error("Error generating course:", error);
      if (ENABLE_CLIENT_FALLBACK && import.meta.env.DEV) {
        try {
          const fallbackCourse = await generateCourse(topic, { skillLevel });
          saveCourse(fallbackCourse);
          return;
        } catch (fallbackError) {
          console.error('Fallback generation failed:', fallbackError);
        }
      }
      alert(error instanceof Error ? error.message : "Failed to generate course. Please try again with a different topic.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles topic submission - prompts auth if needed.
   */
  const handleStart = async (topic: string, skillLevel?: 'beginner' | 'intermediate' | 'advanced') => {
    if (!session) {
      setPendingTopic(topic);
      setAuthModalOpen(true);
      // Store skill level for after auth
      if (skillLevel) {
        localStorage.setItem('pendingSkillLevel', skillLevel);
      }
      return;
    }
    await runStart(topic, skillLevel);
  };

  /**
   * Resumes a saved course.
   */
  const handleResume = (course: Course) => {
    if (!session) {
      setAuthModalOpen(true);
      return;
    }
    setCourseData(course);
  };

  /**
   * Returns to the onboarding screen.
   */
  const handleBackToHome = () => {
    setCourseData(null);
  };

  /**
   * Logs out the current user.
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Callback after successful authentication.
   * Generates course if a topic was pending (with stored skill level).
   */
  const handleAuthenticated = () => {
    if (pendingTopic) {
      const topic = pendingTopic;
      const skillLevel = localStorage.getItem('pendingSkillLevel') as 'beginner' | 'intermediate' | 'advanced' | null;
      setPendingTopic(null);
      localStorage.removeItem('pendingSkillLevel');
      void runStart(topic, skillLevel || undefined);
    }
  };

  // Render onboarding/auth or dashboard based on course state
  if (!courseData) {
    return (
      <>
        <Onboarding
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
      </>
    );
  }

  return (
    <>
      {courseData ? (
        <Dashboard course={courseData} onUpdateCourse={saveCourse} onBack={handleBackToHome} />
      ) : (
        <>
          <Onboarding
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
        </>
      )}
      <Analytics />
    </>
  );
}
