import { useState } from 'react';
import {
  GraduationCap, Sparkles, Brain, Calendar, CheckCircle2, Zap, Trophy, Clock,
  ArrowRight, Check, Star, ChevronDown, ChevronUp, ShieldCheck, Layers, Flame,
  TrendingUp, BookOpen, Users, BarChart3, HelpCircle, Lock, Play, FileText,
} from 'lucide-react';

type Props = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

const FEATURES = [
  {
    icon: Sparkles,
    color: 'from-primary-500 to-indigo-600',
    title: 'AI Workload Scheduler',
    description: 'Algorithms automatically analyze task difficulty, urgency, and exam dates to construct balanced daily study schedules without burnout.',
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    title: '24/7 AI Personal Tutor',
    description: 'Ask questions tailored to your exact grade level. Get step-by-step problem breakdowns, practice questions, and custom exam study guides.',
  },
  {
    icon: Layers,
    color: 'from-amber-500 to-orange-600',
    title: '3D Flashcards & Quizzes',
    description: 'Turn lecture notes into interactive 3D flashcard decks. Test yourself with multiple choice practice quizzes and instant AI explanations.',
  },
  {
    icon: Clock,
    color: 'from-cyan-500 to-blue-600',
    title: 'Pomodoro Focus Timer',
    description: 'Stay in flow state with customizable focus and break sessions, floating mini-widgets, and real-time study logging.',
  },
  {
    icon: Trophy,
    color: 'from-emerald-500 to-teal-600',
    title: 'Gamified Level Ranks & XP',
    description: 'Earn XP for completing daily study quests, maintain streaks, unlock achievement badges, and climb student rank levels.',
  },
  {
    icon: BarChart3,
    color: 'from-rose-500 to-red-600',
    title: 'Deep Learning Analytics',
    description: 'Track 30-day consistency heatmaps, subject performance matrices, and weekly goal completion rates to optimize habits.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Senior, High School',
    school: 'Lincoln High',
    avatar: 'S',
    rating: 5,
    quote: 'Lumora took the stress out of my AP exams. The AI scheduler broke down my 6 subjects into manageable 30-minute sessions every day. Raised my GPA from 3.6 to 3.95!',
  },
  {
    name: 'Marcus Vance',
    role: 'Undergraduate Student',
    school: 'UC Berkeley',
    avatar: 'M',
    rating: 5,
    quote: 'The AI Tutor and 3D flashcards are game changers for Calculus and Physics. I can test my recall right before exams and see instant explanations.',
  },
  {
    name: 'Elena Rostova',
    role: 'Pre-Med Student',
    school: 'Columbia University',
    avatar: 'E',
    rating: 5,
    quote: 'I used to struggle with study burnout. Lumora’s burnout detection caps my daily study load and keeps me consistent with study streaks.',
  },
];

const FAQS = [
  {
    q: 'How does the AI scheduling algorithm work?',
    a: 'Lumora evaluates task due dates, priority ratings, difficulty levels, and your preferred study window hours. It then calculates an optimal daily schedule that front-loads exam preparation while capping daily hours to prevent burnout.',
  },
  {
    q: 'Can the AI Tutor adapt to my specific grade level?',
    a: 'Yes! Lumora customize responses based on your grade profile (Middle School, High School, AP/Honors, Undergraduate, or Graduate), ensuring explanations match your exact academic depth.',
  },
  {
    q: 'How do flashcards and practice quizzes get generated?',
    a: 'When you take or paste class notes in Lumora, the AI engine extracts key definitions, terms, and core concepts to instantly generate 3D interactive flashcards and practice multiple-choice questions.',
  },
  {
    q: 'Is Lumora free to use?',
    a: 'Yes! Lumora offers a comprehensive free plan with core scheduling, task management, flashcards, and basic AI tutor access. You can upgrade to Pro for unlimited AI regenerations and advanced analytics.',
  },
  {
    q: 'Does Lumora work across mobile and desktop browsers?',
    a: 'Lumora is fully responsive and optimized for mobile phones, tablets, and desktop computers with light and dark mode support.',
  },
];

export function LandingPage({ onGetStarted, onSignIn }: Props) {
  const [annualBilling, setAnnualBilling] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-x-hidden">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 via-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-neutral-900 dark:text-white tracking-tight">Lumora</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-500 block -mt-1">AI Study Hub</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Testimonials</a>
            <a href="#pricing" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="btn-ghost text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:text-primary-600"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="btn-primary text-sm font-bold shadow-glow-primary"
            >
              <Sparkles className="w-4 h-4" /> Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200/60 dark:border-primary-800/60 text-xs font-bold shadow-sm animate-scale-in">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Next-Gen AI Study Planning & Personal Tutor</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.15]">
              Study Smarter, Not Harder with{' '}
              <span className="bg-gradient-to-r from-primary-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Lumora AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
              Transform exam dates and assignment deadlines into stress-free daily schedules. Get personalized AI tutoring, 3D flashcards, and gamified focus rewards.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={onGetStarted}
                className="btn-primary w-full sm:w-auto text-base px-8 py-4 shadow-glow-primary font-bold group"
              >
                <span>Start Planning Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#how-it-works"
                className="btn-secondary w-full sm:w-auto text-base px-8 py-4 font-bold flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current text-primary-500" />
                See How It Works
              </a>
            </div>

            {/* Micro Trust Proof */}
            <div className="flex items-center justify-center gap-6 pt-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-success-500" /> Free Forever Tier</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary-500" /> No Credit Card Required</span>
            </div>
          </div>

          {/* Interactive Preview Dashboard Mockup */}
          <div className="mt-14 relative mx-auto max-w-5xl rounded-3xl p-3 bg-gradient-to-b from-neutral-200/80 to-neutral-300/40 dark:from-neutral-800/80 dark:to-neutral-900/40 shadow-2xl border border-white/20 backdrop-blur-xl animate-slide-up">
            <div className="rounded-2xl bg-neutral-900 text-white overflow-hidden shadow-card border border-neutral-800 relative">
              {/* Window Controls Header */}
              <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs font-mono text-neutral-500 ml-2">app.lumora.ai/dashboard</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold border border-primary-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> AI Schedule Active
                </div>
              </div>

              {/* Mockup Screen Content */}
              <div className="p-6 grid md:grid-cols-3 gap-5 bg-gradient-to-br from-neutral-950 via-neutral-900 to-indigo-950/40">
                {/* Left col: Today's Schedule */}
                <div className="md:col-span-2 space-y-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">AI Daily Recommendation</span>
                      <h4 className="font-bold text-sm text-white">Calculus Problem Set 4 & Physics Review</h4>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-success-500/20 text-success-400 text-xs font-bold border border-success-500/30">
                      2.5 hrs planned
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { time: '16:00', title: 'Calculus: Limits & Derivatives', duration: '45 min', type: 'Assignment', color: 'bg-primary-500' },
                      { time: '17:00', title: 'AP Physics: Newton Laws Practice', duration: '50 min', type: 'Exam Prep', color: 'bg-amber-500' },
                      { time: '18:15', title: 'Organic Chemistry Flashcard Review', duration: '30 min', type: 'Quiz', color: 'bg-violet-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-400">{item.time}</span>
                        <div className={`w-2 h-8 rounded-full ${item.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-neutral-400">{item.type} • {item.duration}</p>
                        </div>
                        <button className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-xs font-bold hover:bg-primary-500 hover:text-white transition-colors">
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right col: Gamification & AI Tutor Card */}
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-600/30 to-indigo-600/30 border border-primary-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Flame className="w-4 h-4 fill-amber-400" /> 12 Day Streak!
                      </span>
                      <span className="text-xs font-bold text-white">Lvl 4 Scholar</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/40 overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-primary-400 w-3/4" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-400">
                      <Brain className="w-4 h-4" /> Lumora AI Tutor
                    </div>
                    <p className="text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 leading-relaxed">
                      "Here is a 4-step framework for isolating terms in derivatives..."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-6 -left-6 hidden sm:flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 animate-float">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">Streak Preserved!</p>
                <p className="text-[10px] text-neutral-400">+50 XP Earned Today</p>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 hidden sm:flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 animate-float" style={{ animationDelay: '2s' }}>
              <div className="w-8 h-8 rounded-xl bg-success-500/20 text-success-500 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">Exam Ready</p>
                <p className="text-[10px] text-neutral-400">3D Flashcards Mastered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-10 bg-white/50 dark:bg-neutral-900/50 border-y border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">50,000+</p>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">2.5 Million</p>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">Study Hours Planned</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">4.9 / 5.0</p>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Student Rating
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">+35%</p>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">Avg GPA Boost</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-primary-500">Everything You Need To Excel</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              An All-In-One AI Academic Toolkit
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              Eliminate exam anxiety and disorganized notes with an integrated suite of intelligent tools designed specifically for students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border-neutral-200/80 dark:border-neutral-800"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white mb-5 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">{feat.title}</h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-neutral-100/60 dark:bg-neutral-900/40 border-y border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-primary-500">Simple 3-Step Process</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              How Lumora Guarantees Success
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Add Your Tasks & Exams',
                desc: 'Enter homework assignments, project deadlines, and exam dates with estimated study times and difficulty.',
              },
              {
                step: '02',
                title: 'Generate AI Schedule',
                desc: 'Lumora builds a personalized daily study plan that front-loads exam preparation and distributes daily hours evenly.',
              },
              {
                step: '03',
                title: 'Learn, Focus & Ace Exams',
                desc: 'Use the Pomodoro focus timer, generate 3D flashcards from lecture notes, and clear questions with your AI Tutor.',
              },
            ].map((s, idx) => (
              <div key={idx} className="card p-6 relative">
                <span className="text-4xl font-black text-primary-500/20 dark:text-primary-400/20 absolute top-4 right-6 font-mono">
                  {s.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 font-bold flex items-center justify-center mb-4 text-sm">
                  {s.step}
                </div>
                <h4 className="font-bold text-base text-neutral-900 dark:text-white mb-2">{s.title}</h4>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-primary-500">Loved By Students</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Real Results From Top Performers
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-500">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-5 mt-5 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">{t.name}</h5>
                    <p className="text-[11px] text-neutral-400">{t.role} • {t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-neutral-100/60 dark:bg-neutral-900/40 border-y border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-primary-500">Simple, Transparent Pricing</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Invest In Your Academic Future
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              Start free today and upgrade as your study needs grow.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-bold ${!annualBilling ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>Monthly</span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`w-12 h-6 rounded-full p-1 relative transition-colors ${annualBilling ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${annualBilling ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-xs font-bold ${annualBilling ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                Annual <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px]">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-lg text-neutral-900 dark:text-white">Free Student</h4>
                <p className="text-xs text-neutral-400 mt-1">Essential tools for organized studying</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white">$0</span>
                  <span className="text-xs text-neutral-400"> / forever</span>
                </div>
                <ul className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> Smart AI Schedule Generation</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> Unlimited Tasks & Assignments</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> 3D Flashcards & Practice Decks</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> 5 AI Tutor queries / day</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> Pomodoro Focus Timer</li>
                </ul>
              </div>
              <button onClick={onGetStarted} className="btn-secondary w-full mt-8 font-bold">
                Get Started Free
              </button>
            </div>

            {/* Pro Scholar Tier (Featured) */}
            <div className="card p-6 flex flex-col justify-between relative border-2 border-primary-500 shadow-glow-primary bg-gradient-to-b from-white to-primary-50/30 dark:from-neutral-900 dark:to-primary-950/20">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                Most Popular
              </span>
              <div>
                <h4 className="font-bold text-lg text-neutral-900 dark:text-white">Pro Scholar</h4>
                <p className="text-xs text-neutral-400 mt-1">For students aiming for top honors</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white">{annualBilling ? '$6' : '$8'}</span>
                  <span className="text-xs text-neutral-400"> / month</span>
                </div>
                <ul className="space-y-3 text-xs text-neutral-700 dark:text-neutral-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary-500 shrink-0" /> <strong>Unlimited</strong> AI Schedule Regenerations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary-500 shrink-0" /> <strong>Unlimited</strong> AI Tutor & Practice Quizzes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary-500 shrink-0" /> Priority Burnout & Overdue Alerts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary-500 shrink-0" /> 30-Day Consistency Heatmaps</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary-500 shrink-0" /> Custom Study Reminders</li>
                </ul>
              </div>
              <button onClick={onGetStarted} className="btn-primary w-full mt-8 font-bold shadow-glow-primary">
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Campus / Team Plan */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-lg text-neutral-900 dark:text-white">Campus & Team</h4>
                <p className="text-xs text-neutral-400 mt-1">For study groups & schools</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white">{annualBilling ? '$12' : '$15'}</span>
                  <span className="text-xs text-neutral-400"> / user / month</span>
                </div>
                <ul className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> Everything in Pro Scholar</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> Shared Group Study Decks</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> Peer Practice Leaderboards</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success-500 shrink-0" /> Dedicated Academic Support</li>
                </ul>
              </div>
              <button onClick={onGetStarted} className="btn-secondary w-full mt-8 font-bold">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-primary-500">Frequently Asked Questions</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
              Got Questions? We’ve Got Answers
            </h3>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-primary-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 animate-slide-up">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Conversion CTA Banner */}
      <section className="py-20 px-5 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-700 p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready To Ace Your Next Exam?
            </h2>
            <p className="text-sm sm:text-base text-white/80 font-medium">
              Join over 50,000 top-performing students today. Build your first AI schedule in under 2 minutes.
            </p>
            <button
              onClick={onGetStarted}
              className="btn bg-white text-primary-700 hover:bg-neutral-100 px-8 py-4 font-extrabold text-base shadow-lg hover:scale-105 transition-all"
            >
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" /> Start Planning Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-neutral-900 text-neutral-400 text-xs border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">Lumora AI</span>
            <span className="text-[10px] text-neutral-500">© {new Date().getFullYear()} Lumora Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <button onClick={onSignIn} className="hover:text-white transition-colors">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
}