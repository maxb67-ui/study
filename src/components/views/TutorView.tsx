import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot, Send, Sparkles, BookOpen, HelpCircle, CheckCircle2, Copy, Check,
  RotateCcw, FileText, Brain, GraduationCap, Lightbulb, Layers, Zap,
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { generateTutorResponse, type TutorMode, type TutorMessage } from '@/lib/aiTutorEngine';

const QUICK_PROMPTS = [
  { label: 'Explain Concept', mode: 'explain' as TutorMode, icon: Brain, desc: 'Grade-adapted plain English explanation' },
  { label: 'Step-by-Step Solution', mode: 'step_by_step' as TutorMode, icon: Layers, desc: 'Detailed breakdown of a hard problem' },
  { label: 'Practice Questions', mode: 'practice' as TutorMode, icon: HelpCircle, desc: 'Self-test questions with answers' },
  { label: 'Build Study Guide', mode: 'study_guide' as TutorMode, icon: FileText, desc: 'Structured exam review guide' },
];

export function TutorView(props: NavProps) {
  const { profile } = useAuth();
  const toast = useToast();

  const userClasses = useMemo(() => profile?.classes ?? ['Mathematics', 'Physics', 'Chemistry', 'History'], [profile]);
  const [selectedSubject, setSelectedSubject] = useState<string>(userClasses[0] || 'General');
  const [activeMode, setActiveMode] = useState<TutorMode>('explain');
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${profile?.full_name?.split(' ')[0] || 'Student'}! 👋 I'm your Lumora AI Tutor. I can explain complex concepts at your grade level (**${profile?.grade_level || 'AP / Honors'}**), walk through difficult problems step-by-step, generate practice questions, or build complete study guides. What topic are we tackling today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  function handleSend(overrideQuery?: string, overrideMode?: TutorMode) {
    const q = (overrideQuery || inputQuery).trim();
    const mode = overrideMode || activeMode;
    if (!q) return;

    const userMsg: TutorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      mode,
      subject: selectedSubject,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideQuery) setInputQuery('');
    setLoading(true);

    setTimeout(() => {
      const response = generateTutorResponse(q, mode, selectedSubject, profile);
      const aiMsg: TutorMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        mode,
        subject: selectedSubject,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredData: response.structuredData,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 600);
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('success', 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClear() {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: `Chat reset! Select a topic or subject to begin. Current Grade Level: **${profile?.grade_level || 'AP / Honors'}**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    toast('info', 'Chat history cleared');
  }

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8 flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-40px)]">
      <PageHeader
        title="AI Personal Tutor"
        subtitle={`Grade-level tailored explanations (${profile?.grade_level || 'AP / Honors'}), step-by-step problem solving & exam prep`}
        action={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              {profile?.grade_level || 'Honors'}
            </span>
            <button onClick={handleClear} className="btn-secondary text-xs">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Chat
            </button>
          </div>
        }
      />

      {/* Control bar: Subject + Study Mode */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label text-[10px]">Current Class / Subject</label>
          <div className="relative">
            <BookOpen className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input pl-9 py-2 text-xs font-medium cursor-pointer"
            >
              {userClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="General">General / Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label text-[10px]">Tutor Mode</label>
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl gap-1">
            {QUICK_PROMPTS.map((p) => {
              const Icon = p.icon;
              const active = activeMode === p.mode;
              return (
                <button
                  key={p.mode}
                  onClick={() => setActiveMode(p.mode)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    active
                      ? 'bg-primary-500 text-white shadow-soft'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title={p.desc}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 card p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div key={msg.id} className={`flex gap-3 ${isAi ? 'items-start' : 'items-end justify-end'}`}>
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shrink-0 shadow-soft mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                isAi
                  ? 'bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-900 dark:text-neutral-100'
                  : 'bg-primary-500 text-white'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-1.5 opacity-70 text-[10px]">
                  <span className="font-semibold uppercase tracking-wider">{isAi ? 'Lumora AI' : 'You'}</span>
                  <div className="flex items-center gap-2">
                    {msg.subject && <span>{msg.subject}</span>}
                    <span>{msg.timestamp}</span>
                    {isAi && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:opacity-100 transition-opacity"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-success-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* Structured Steps rendering */}
                {msg.structuredData?.steps && (
                  <div className="mt-3 space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    {msg.structuredData.steps.map((s) => (
                      <div key={s.stepNumber} className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <span className="font-bold text-xs text-primary-600 dark:text-primary-400 block mb-0.5">
                          Step {s.stepNumber}: {s.title}
                        </span>
                        <span className="text-[11px] text-neutral-600 dark:text-neutral-300">{s.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Structured Questions rendering */}
                {msg.structuredData?.questions && (
                  <div className="mt-3 space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    {msg.structuredData.questions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                        <p className="font-semibold text-xs text-neutral-900 dark:text-white">{idx + 1}. {q.question}</p>
                        {q.options && (
                          <div className="space-y-1 pl-2">
                            {q.options.map((opt, oIdx) => (
                              <p key={oIdx} className="text-[11px] text-neutral-600 dark:text-neutral-400">{opt}</p>
                            ))}
                          </div>
                        )}
                        <details className="text-[11px] text-success-600 dark:text-success-400 cursor-pointer pt-1">
                          <summary className="font-medium">Reveal Answer & Explanation</summary>
                          <p className="mt-1 p-2 rounded bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300">
                            <strong>Correct:</strong> {q.answer}<br />
                            {q.explanation}
                          </p>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-neutral-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-500">
              <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <span>AI Tutor is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => handleSend(`Explain the key principles of ${selectedSubject}`, 'explain')}
          className="chip bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:bg-primary-100 cursor-pointer text-[11px] whitespace-nowrap"
        >
          <Lightbulb className="w-3 h-3" />
          Explain {selectedSubject} core principles
        </button>
        <button
          onClick={() => handleSend(`Step-by-step example problem for ${selectedSubject}`, 'step_by_step')}
          className="chip bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 cursor-pointer text-[11px] whitespace-nowrap"
        >
          <Layers className="w-3 h-3" />
          Step-by-step example problem
        </button>
        <button
          onClick={() => handleSend(`Generate practice questions for ${selectedSubject}`, 'practice')}
          className="chip bg-success-50 dark:bg-success-950/40 text-success-600 dark:text-success-400 hover:bg-success-100 cursor-pointer text-[11px] whitespace-nowrap"
        >
          <HelpCircle className="w-3 h-3" />
          Generate 2 practice questions
        </button>
        <button
          onClick={() => handleSend(`Create exam study guide for ${selectedSubject}`, 'study_guide')}
          className="chip bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400 hover:bg-accent-100 cursor-pointer text-[11px] whitespace-nowrap"
        >
          <FileText className="w-3 h-3" />
          Build exam study guide
        </button>
      </div>

      {/* Chat Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask AI Tutor a question in ${selectedSubject}... (${profile?.grade_level || 'Grade Level'} mode)`}
          className="input flex-1 py-3 text-xs sm:text-sm"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="btn-primary py-3 px-5 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}