import { useState, useMemo } from 'react';
import {
  Plus, Search, BookOpen, FileText, Sparkles, Trash2, Edit3, Save, Tag,
  X, Brain, HelpCircle, Layers, Check, ArrowLeft,
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Note, NoteInput } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';
import { generateNoteSummary, generateFlashcards, generatePracticeQuiz } from '@/lib/aiNotesEngine';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { QuizRunner } from '@/components/QuizRunner';

type Tab = 'editor' | 'summary' | 'flashcards' | 'quiz';

export function NotesView(props: NavProps & { notes: Note[]; onSaveNote: (n: NoteInput, id?: string) => Promise<void>; onDeleteNote: (id: string) => Promise<void> }) {
  const { notes, onSaveNote, onDeleteNote, loading } = props;
  const { profile } = useAuth();
  const toast = useToast();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  // Note editor form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Available subjects
  const subjects = useMemo(() => {
    const profileClasses = profile?.classes ?? [];
    const noteSubjects = notes.map((n) => n.subject);
    return [...new Set([...profileClasses, ...noteSubjects])].sort();
  }, [profile, notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchSubject = selectedSubject === 'all' || note.subject === selectedSubject;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags.some((t) => t.toLowerCase().includes(q));
      return matchSubject && matchQuery;
    });
  }, [notes, selectedSubject, searchQuery]);

  const activeNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  function handleSelectNote(note: Note) {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setSubject(note.subject);
    setContent(note.content);
    setTags(note.tags || []);
    setActiveTab('editor');
  }

  function handleCreateNew() {
    setSelectedNoteId(null);
    setTitle('');
    setSubject(subjects[0] || 'General');
    setContent('');
    setTags([]);
    setActiveTab('editor');
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((tag) => tag !== t));
  }

  async function handleSave() {
    if (!title.trim()) {
      toast('error', 'Note title is required');
      return;
    }
    setIsSaving(true);
    await onSaveNote(
      {
        title: title.trim(),
        subject: subject.trim() || 'General',
        content,
        tags,
      },
      selectedNoteId ?? undefined,
    );
    setIsSaving(false);
  }

  async function handleDelete() {
    if (!selectedNoteId) return;
    await onDeleteNote(selectedNoteId);
    setSelectedNoteId(null);
    handleCreateNew();
  }

  // AI Generated Outputs
  const aiSummary = useMemo(() => generateNoteSummary(content, title || 'Untitled'), [content, title]);
  const aiFlashcards = useMemo(() => generateFlashcards(content), [content]);
  const aiQuiz = useMemo(() => generatePracticeQuiz(content, title || 'Untitled'), [content, title]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            <div className="lg:col-span-2 h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader
        title="Class Notes & AI Study Hub"
        subtitle="Organize notes by subject and generate AI summaries, flashcards & quizzes"
        action={
          <button onClick={handleCreateNew} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Note
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Subject Filter & Notes List */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes or tags..."
              className="input pl-9 py-2 text-xs"
            />
          </div>

          {/* Subject pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedSubject === 'all'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSubject === s
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Notes list */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="card p-6 text-center text-xs text-neutral-400">
                <FileText className="w-6 h-6 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                No notes found. Click "New Note" to create one.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const active = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3.5 rounded-xl card cursor-pointer transition-all hover:shadow-md ${
                      active ? 'ring-2 ring-primary-500 bg-primary-50/20 dark:bg-primary-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{note.title || 'Untitled Note'}</h4>
                      <span className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-600 text-[10px] font-semibold shrink-0">
                        {note.subject}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-2 leading-relaxed">
                      {note.content || 'Empty note...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Editor & AI Tools */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sub-navigation tabs */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'summary'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              AI Summary
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-primary-500" />
              Flashcards
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'quiz'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-success-500" />
              Quiz
            </button>
          </div>

          {/* TAB CONTENT: EDITOR */}
          {activeTab === 'editor' && (
            <div className="card p-5 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="text-lg font-bold bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-1 w-full focus:outline-none text-neutral-900 dark:text-white"
                />
                <div className="flex items-center gap-2 shrink-0">
                  {selectedNoteId && (
                    <button onClick={handleDelete} className="btn-ghost p-2 text-error-500" title="Delete Note">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={handleSave} disabled={isSaving} className="btn-primary py-1.5 text-xs">
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="label text-[10px]">Class / Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics, History"
                    className="input py-1.5 text-xs"
                  />
                </div>
                <div className="w-1/2">
                  <label className="label text-[10px]">Add Tag</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Tag..."
                      className="input py-1.5 text-xs"
                    />
                    <button onClick={addTag} className="btn-secondary px-2.5">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 text-xs font-medium flex items-center gap-1">
                      #{t}
                      <X className="w-3 h-3 cursor-pointer hover:text-error-500" onClick={() => removeTag(t)} />
                    </span>
                  ))}
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write or paste your class notes here..."
                className="input min-h-[320px] font-mono text-xs sm:text-sm leading-relaxed resize-y"
              />
            </div>
          )}

          {/* TAB CONTENT: AI SUMMARY */}
          {activeTab === 'summary' && (
            <div className="card p-5 space-y-4 animate-scale-in">
              <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <Sparkles className="w-5 h-5 text-accent-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">AI Note Summary</h3>
              </div>

              <div>
                <p className="label text-[10px]">Overview</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl">
                  {aiSummary.overview}
                </p>
              </div>

              <div>
                <p className="label text-[10px]">Key Takeaways</p>
                <ul className="space-y-1.5">
                  {aiSummary.keyPoints.map((point, i) => (
                    <li key={i} className="text-xs text-neutral-700 dark:text-neutral-200 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {aiSummary.terms.length > 0 && (
                <div>
                  <p className="label text-[10px]">Key Terminology</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {aiSummary.terms.map((t, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                        <span className="font-bold text-xs text-primary-600 dark:text-primary-400 block">{t.term}</span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{t.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: AI FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="animate-scale-in">
              <FlashcardDeck flashcards={aiFlashcards} />
            </div>
          )}

          {/* TAB CONTENT: PRACTICE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="animate-scale-in">
              <QuizRunner questions={aiQuiz} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}