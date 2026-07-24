import { useState, useRef, useEffect } from 'react';
import { GraduationCap, School, BookOpen, Brain, Target, CalendarClock, Plus, X, Check, ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase, type Task } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const GRADE_LEVELS = [
  'Middle School', 'Freshman', 'Sophomore', 'Junior', 'Senior',
  'AP / Honors', 'Undergraduate', 'Graduate', 'Other',
];

const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual', desc: 'Diagrams, charts, color-coded notes', icon: '👁️' },
  { id: 'auditory', label: 'Auditory', desc: 'Lectures, discussion, reading aloud', icon: '👂' },
  { id: 'reading', label: 'Reading/Writing', desc: 'Text-based notes, textbooks, lists', icon: '📖' },
  { id: 'kinesthetic', label: 'Kinesthetic', desc: 'Hands-on practice, flashcards, movement', icon: '✋' },
  { id: 'mixed', label: 'Mixed', desc: 'A blend of different methods', icon: '🎯' },
];

const STUDY_TIMES = [
  { id: 'morning', label: 'Morning', time: '06:00 - 10:00', icon: '🌅' },
  { id: 'midday', label: 'Midday', time: '10:00 - 14:00', icon: '☀️' },
  { id: 'afternoon', label: 'Afternoon', time: '14:00 - 18:00', icon: '🌤️' },
  { id: 'evening', label: 'Evening', time: '18:00 - 22:00', icon: '🌆' },
  { id: 'late', label: 'Late Night', time: '22:00 - 02:00', icon: '🌙' },
];

const TIME_MAP: Record<string, { start: string; end: string }> = {
  morning: { start: '06:00', end: '10:00' },
  midday: { start: '10:00', end: '14:00' },
  afternoon: { start: '14:00', end: '18:00' },
  evening: { start: '18:00', end: '22:00' },
  late: { start: '22:00', end: '02:00' },
};

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const TOTAL_STEPS: Step = 6;

export function OnboardingView() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);

  // Step 0: Grade + School
  const [fullName, setFullName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [schoolName, setSchoolName] = useState('');

  // Step 1: Classes
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState('');

  // Step 2: Learning style
  const [learningStyle, setLearningStyle] = useState('');

  // Step 3: Study goals
  const [studyGoals, setStudyGoals] = useState('');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120);

  // Step 4: Preferred study time
  const [studyTime, setStudyTime] = useState('evening');

  // Step 5: Assignments & exams
  const [tasks, setTasks] = useState<Partial<Task>[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskType, setTaskType] = useState<'assignment' | 'exam' | 'deadline'>('assignment');
  const [taskDueDate, setTaskDueDate] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setGradeLevel(profile.grade_level || '');
      setSchoolName(profile.school_name || '');
      setClasses(profile.classes || []);
      setLearningStyle(profile.learning_style || '');
      setStudyGoals(profile.study_goals || '');
    }
  }, [profile]);

  function addClass() {
    const trimmed = newClass.trim();
    if (!trimmed) return;
    if (classes.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast('error', 'That class is already in your list');
      return;
    }
    setClasses([...classes, trimmed]);
    setNewClass('');
  }

  function removeClass(cls: string) {
    setClasses(classes.filter((c) => c !== cls));
  }

  function addTask() {
    if (!taskTitle.trim() || !taskDueDate) return;
    setTasks([...tasks, {
      title: taskTitle.trim(),
      subject: taskSubject.trim() || 'General',
      type: taskType,
      due_date: taskDueDate,
      difficulty: 3,
      priority: 3,
      estimated_hours: 2,
      completed: false,
      notes: null,
    }]);
    setTaskTitle('');
    setTaskSubject('');
    setTaskDueDate('');
    setTaskType('assignment');
  }

  function removeTask(idx: number) {
    setTasks(tasks.filter((_, i) => i !== idx));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!fullName.trim();
      case 1: return true;
      case 2: return !!learningStyle;
      case 3: return true;
      case 4: return !!studyTime;
      case 5: return true;
      default: return true;
    }
  }

  function next() {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS) setStep((step + 1) as Step);
  }

  function back() {
    if (step > 0) setStep((step - 1) as Step);
  }

  async function finish() {
    setSaving(true);

    const profilePatch = {
      full_name: fullName.trim(),
      grade_level: gradeLevel || null,
      school_name: schoolName.trim() || null,
      classes,
      learning_style: learningStyle || null,
      study_goals: studyGoals.trim() || null,
      onboarded: true,
    };

    const { error: profileError } = await updateProfile(profilePatch);
    if (profileError) {
      toast('error', 'Failed to save profile');
      setSaving(false);
      return;
    }

    // Update settings with preferred study time + daily goal
    const timeRange = TIME_MAP[studyTime] ?? TIME_MAP.evening;
    const { error: settingsError } = await supabase
      .from('settings')
      .update({
        study_start_time: timeRange.start,
        study_end_time: timeRange.end,
        daily_goal_minutes: dailyGoalMinutes,
      })
      .eq('user_id', user!.id);

    if (settingsError) {
      toast('error', 'Failed to save study preferences');
      setSaving(false);
      return;
    }

    // Insert any tasks the user added
    if (tasks.length > 0) {
      const { error: tasksError } = await supabase.from('tasks').insert(
        tasks.map((t) => ({
          title: t.title!,
          subject: t.subject!,
          type: t.type!,
          due_date: t.due_date!,
          difficulty: t.difficulty ?? 3,
          priority: t.priority ?? 3,
          estimated_hours: t.estimated_hours ?? 2,
          completed: false,
          notes: null,
        })),
      );
      if (tasksError) {
        toast('error', 'Failed to save some assignments');
      }
    }

    await refreshProfile();
    toast('success', 'Onboarding complete! Welcome to Lumora.');
    setSaving(false);
  }

  function skip() {
    setSaving(true);
    updateProfile({ onboarded: true }).then(async ({ error }) => {
      if (error) {
        toast('error', 'Failed to save');
        setSaving(false);
        return;
      }
      await refreshProfile();
      setSaving(false);
    });
  }

  const stepLabels = ['Profile', 'Classes', 'Learning Style', 'Goals', 'Study Times', 'Assignments', 'Done'];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-200/30 dark:bg-accent-900/20 blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col max-w-2xl mx-auto w-full px-5 py-6 lg:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-neutral-900 dark:text-white">Welcome to Lumora</h1>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Let's personalize your study experience</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-1.5 rounded-full w-full transition-all duration-300 ${
                i <= step ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-800'
              }`} />
              <span className={`text-[10px] font-medium transition-colors ${
                i === step ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-600'
              }`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 animate-slide-up" key={step}>
          {step === 0 && (
            <StepCard icon={<GraduationCap className="w-5 h-5 text-primary-500" />} title="Tell us about you" subtitle="This helps us tailor your study plans">
              <div className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Grade Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GRADE_LEVELS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setGradeLevel(g)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          gradeLevel === g
                            ? 'bg-primary-500 text-white shadow-soft'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">School / Institution</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Lincoln High School"
                    className="input"
                  />
                </div>
              </div>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard icon={<BookOpen className="w-5 h-5 text-primary-500" />} title="Your classes" subtitle="What subjects are you studying?">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addClass(); } }}
                    placeholder="e.g. AP Calculus, Chemistry..."
                    className="input flex-1"
                    autoFocus
                  />
                  <button onClick={addClass} className="btn-secondary px-3">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {classes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {classes.map((cls) => (
                      <span key={cls} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-sm font-medium animate-scale-in">
                        {cls}
                        <button onClick={() => removeClass(cls)} className="text-primary-400 hover:text-error-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">
                    Add at least one class to help organize your tasks. You can skip and add later.
                  </p>
                )}
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard icon={<Brain className="w-5 h-5 text-primary-500" />} title="How do you learn best?" subtitle="We'll adapt your study materials accordingly">
              <div className="space-y-2.5">
                {LEARNING_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setLearningStyle(style.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      learningStyle === style.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-transparent bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-2xl">{style.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{style.label}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{style.desc}</p>
                    </div>
                    {learningStyle === style.id && <Check className="w-5 h-5 text-primary-500" />}
                  </button>
                ))}
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard icon={<Target className="w-5 h-5 text-primary-500" />} title="Your study goals" subtitle="What do you want to achieve?">
              <div className="space-y-4">
                <div>
                  <label className="label">What's your main goal this semester?</label>
                  <textarea
                    value={studyGoals}
                    onChange={(e) => setStudyGoals(e.target.value)}
                    placeholder="e.g. Pass all AP exams with A's, maintain a 3.8 GPA..."
                    className="input min-h-[80px] resize-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Daily Study Goal: {Math.round(dailyGoalMinutes / 60 * 10) / 10} hours</label>
                  <input
                    type="range"
                    min="30"
                    max="480"
                    step="15"
                    value={dailyGoalMinutes}
                    onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                    <span>30 min</span>
                    <span>2h</span>
                    <span>4h</span>
                    <span>8h</span>
                  </div>
                </div>
              </div>
            </StepCard>
          )}

          {step === 4 && (
            <StepCard icon={<CalendarClock className="w-5 h-5 text-primary-500" />} title="When do you study best?" subtitle="We'll schedule your sessions during these hours">
              <div className="space-y-2.5">
                {STUDY_TIMES.map((time) => (
                  <button
                    key={time.id}
                    onClick={() => setStudyTime(time.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      studyTime === time.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-transparent bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-2xl">{time.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{time.label}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{time.time}</p>
                    </div>
                    {studyTime === time.id && <Check className="w-5 h-5 text-primary-500" />}
                  </button>
                ))}
              </div>
            </StepCard>
          )}

          {step === 5 && (
            <StepCard icon={<Sparkles className="w-5 h-5 text-primary-500" />} title="Add assignments & exams" subtitle="Get a head start on your schedule — add any upcoming items you know about">
              <div className="space-y-4">
                <div className="space-y-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
                      placeholder="Assignment or exam name"
                      className="input flex-1"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
                      placeholder="Subject"
                      className="input w-28"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value as 'assignment' | 'exam' | 'deadline')}
                      className="input flex-1"
                    >
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="deadline">Deadline</option>
                    </select>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="input flex-1"
                    />
                    <button
                      onClick={addTask}
                      disabled={!taskTitle.trim() || !taskDueDate}
                      className="btn-primary px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-slide-up">
                        <div className={`w-2 h-8 rounded-full ${
                          task.type === 'exam' ? 'bg-accent-400' : task.type === 'deadline' ? 'bg-error-400' : 'bg-primary-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{task.title}</p>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">{task.subject} · {task.type} · due {task.due_date}</p>
                        </div>
                        <button onClick={() => removeTask(i)} className="text-neutral-400 hover:text-error-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">
                    No items added yet. This step is optional — you can add tasks later.
                  </p>
                )}
              </div>
            </StepCard>
          )}

          {step === 6 && (
            <StepCard icon={<Check className="w-5 h-5 text-success-500" />} title="You're all set!" subtitle="Here's a summary of your profile">
              <div className="space-y-3">
                <SummaryRow label="Name" value={fullName} />
                <SummaryRow label="Grade" value={gradeLevel || 'Not set'} />
                <SummaryRow label="School" value={schoolName || 'Not set'} />
                <SummaryRow label="Classes" value={classes.length > 0 ? classes.join(', ') : 'None yet'} />
                <SummaryRow label="Learning Style" value={LEARNING_STYLES.find((s) => s.id === learningStyle)?.label ?? 'Not set'} />
                <SummaryRow label="Study Goals" value={studyGoals || 'Not set'} />
                <SummaryRow label="Daily Goal" value={`${Math.round(dailyGoalMinutes / 60 * 10) / 10} hours`} />
                <SummaryRow label="Study Time" value={STUDY_TIMES.find((t) => t.id === studyTime)?.label ?? 'Evening'} />
                <SummaryRow label="Tasks Added" value={String(tasks.length)} />
              </div>
            </StepCard>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 mt-8 pt-4">
          {step > 0 && step < TOTAL_STEPS && (
            <button onClick={back} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {step < 5 && (
            <button onClick={skip} className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors px-2">
              Skip
            </button>
          )}
          {step < TOTAL_STEPS && (
            <button onClick={next} disabled={!canProceed()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {step === TOTAL_STEPS && (
            <button onClick={finish} disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-base text-neutral-900 dark:text-white">{title}</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-400 dark:text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900 dark:text-white text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
