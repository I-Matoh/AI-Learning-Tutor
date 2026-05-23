import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Course } from '../../types';
import { Icons } from '../../components/icons';
import { BrandLogo } from '../../components/BrandLogo';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

type OnboardingProps = {
  onStart: (topic: string, skillLevel?: SkillLevel) => void;
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

const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'No prior knowledge - start from basics' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience - focus on specifics' },
  { value: 'advanced', label: 'Advanced', description: 'Deep knowledge - focus on mastery' },
];

export const OnboardingScreen: React.FC<OnboardingProps> = ({
  onStart,
  loading,
  savedCourses,
  onResume,
  session,
  authLoading,
  onOpenAuth,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const [topic, setTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');

  const partners = ['Coursera', 'OpenAI', 'Red Hat', 'IBM', 'Northwestern University', 'Harvard', 'Princeton', 'Columbia'];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onStart(topic, skillLevel);
  };

  return (
    <div className="min-h-screen lux-bg relative overflow-hidden p-4 md:p-8">
      <div className="lux-glow lux-glow-a" />
      <div className="lux-glow lux-glow-b" />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4 gap-2 flex-wrap">
          <button onClick={onToggleTheme} className="ghost-btn" aria-label="Toggle theme">
            {theme === 'dark' ? '?? Light mode' : '?? Dark mode'}
          </button>
          {authLoading ? (
            <span className="text-sm text-slate-600 glass-pill">Loading session...</span>
          ) : session ? (
            <button onClick={() => void onLogout()} className="ghost-btn">Logout</button>
          ) : (
            <button onClick={onOpenAuth} className="ghost-btn">Login / Sign up</button>
          )}
        </div>

        <section className="hero-shell">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-14 w-auto rounded-lg shadow-md" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-white/70 text-xs tracking-[0.14em] uppercase text-slate-600">
              <Icons.Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Precision Learning Design
            </div>
            <h1 className="hero-title text-slate-900">What do you want to <span className="text-amber-700">master</span> today?</h1>
            <p className="text-slate-600 text-lg md:text-xl max-w-2xl">Name one high-value topic. Get a structured path, lessons, and practice in minutes.</p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="feature-chip">Clear first step</span>
              <span className="feature-chip">Fast feedback loops</span>
              <span className="feature-chip">Compounding skill growth</span>
            </div>

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
                <button type="submit" disabled={loading || !topic.trim()} className="gold-btn w-full md:w-64 px-7 py-4 rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-center justify-self-center">
                  {loading ? <Icons.RefreshCw className="animate-spin w-5 h-5" /> : <Icons.Sparkles className="w-5 h-5" />}
                  {loading ? 'Building your path...' : 'Build my learning plan'}
                </button>
              </form>

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

            {!session && !authLoading && (
              <p className="text-sm text-amber-900 bg-amber-100/80 border border-amber-200 rounded-xl py-2 px-3 max-w-xl">
                Explore the idea instantly. Login or sign up is required only when you access resources and generate your personalized content.
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <span>Try: "Digital Marketing"</span><span>|</span><span>"Python for Beginners"</span><span>|</span><span>"Renaissance Art"</span>
            </div>

            <div className="max-w-3xl w-full mx-auto">
              <p className="text-center text-sm font-semibold tracking-[0.08em] uppercase text-slate-700 mb-2">Trusted Partners</p>
              <div className="partner-strip">
                <div className="partner-track">
                  <div className="partner-group">
                    {partners.map((partner) => (
                      <span key={`group-a-${partner}`} className="partner-pill" style={{ color: partnerStyles[partner].text, borderColor: partnerStyles[partner].border, backgroundColor: partnerStyles[partner].bg }}>
                        {partner}
                      </span>
                    ))}
                  </div>
                  <div className="partner-group" aria-hidden="true">
                    {partners.map((partner) => (
                      <span key={`group-b-${partner}`} className="partner-pill" style={{ color: partnerStyles[partner].text, borderColor: partnerStyles[partner].border, backgroundColor: partnerStyles[partner].bg }}>
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="glass-panel p-5 stagger-in">
              <h3 className="text-slate-900 font-semibold">Why this flow converts quickly</h3>
              <p className="text-sm text-slate-600 mt-2">One input, immediate structure, visible progress. Reduced decision friction helps users commit faster.</p>
            </div>
            <div className="glass-panel p-5 stagger-in">
              <h3 className="text-slate-900 font-semibold">Your outcome in this session</h3>
              <p className="text-sm text-slate-600 mt-2">A complete course map with lesson-by-lesson progression and checks for retention.</p>
            </div>
          </div>
        </section>

        {savedCourses.length > 0 && (
          <div className="mt-10 text-left">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Icons.Play className="w-5 h-5 text-amber-700" />
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCourses.map((course) => {
                const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                const completedLessons = course.modules.reduce((acc, m) => acc + m.lessons.filter((l) => l.isCompleted).length, 0);
                const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

                return (
                  <button key={course.id} onClick={() => onResume(course)} className="glass-panel p-5 text-left flex flex-col gap-2 group hover:-translate-y-1 transition-all duration-300">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{course.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 flex-1">{course.description}</p>
                    <div className="w-full bg-slate-200/70 rounded-full h-2 mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
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
