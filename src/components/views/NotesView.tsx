import { useState, useMemo } from 'react';
import {
  BookMarked, Plus, Search, Tag, Sparkles, Trash2, Edit3, Calendar,
  Bot, Check, FileText, Share2, Layers, Brain, HelpCircle, LayoutDashboard, X
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Note, NoteInput } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { generateNoteSummary, generateFlashcards, generatePracticeQuiz } from '@/lib/aiNotesEngine';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { QuizRunner } from '@/components/QuizRunner';

type NoteTool = 'content' | 'summary' | 'flashcards' | 'quiz';

export function NotesView(props: NavProps) {
  const { notes, onSaveNote, onDeleteNote, loading } = props;
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTool, setActiveTool] = useState<NoteTool>('content');

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const subjects = useMemo(() => Array.from(new Set(notes.map((n) => n.subject))).filter(Boolean), [notes]);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase()) ||
      note.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  function startCreate() {
    setEditingNote(null);
    setTitle('');
    setSubject(subjects[0] || 'General');
    setContent('');
    setTagsInput('');
    setActiveTool('content');
    setIsCreating(true);
  }

  function startEdit(note: Note) {
    setEditingNote(note);
    setTitle(note.title);
    setSubject(note.subject);
    setContent(note.content);
    setTagsInput(note.tags.join(', '));
    setActiveTool('content');
    setIsCreating(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast('error', 'Note title is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const input: NoteInput = {
      title: title.trim(),
      subject: subject.trim() || 'General',
      content: content.trim(),
      tags,
    };

    await onSaveNote(input, editingNote?.id);
    setIsCreating(false);
    toast('success', 'Note saved');
  }

  // AI Generated Data
  const aiSummary = useMemo(() => generateNoteSummary(content, title), [content, title]);
  const aiFlashcards = useMemo(() => generateFlashcards(content), [content]);
  const aiQuiz = useMemo(() => generatePracticeQuiz(content, title), [content, title]);

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-primary-500" />
            Class Notes & AI Study Tools
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Organize lectures and generate AI summaries, flashcards, and quizzes
          </p>
        </div>

        {!isCreating && (
          <button onClick={startCreate} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Create Note
          </button>
        )}
      </div>

      {!isCreating ? (
        <>
          <div className="card p-3 mb-6 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search content, titles, or tags..."
                className="input pl-9 py-2 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedSubject === 'all'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                All Subjects
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedSubject === sub
                      ? 'bg-primary-500 text-white shadow-soft'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="card p-5 hover:border-primary-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
                      {note.subject}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(note)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteNote(note.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-error-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white line-clamp-1 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-4 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex gap-1">
                    {note.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-neutral-400 font-medium">#{t}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {filteredNotes.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <BookMarked className="w-12 h-12 text-neutral-200 dark:text-neutral-800 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-500">No notes found matching your search</p>
                <button onClick={startCreate} className="btn-secondary mt-4">Create your first note</button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Editor + AI Tool Panel */
        <div className="flex flex-col lg:flex-row gap-6 animate-scale-in">
          {/* Left Column: Editor */}
          <div className="flex-1 space-y-4">
            <div className="card p-5 space-y-4 border-2 border-primary-100 dark:border-primary-900/30 shadow-glow-primary/5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-neutral-900 dark:text-white">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h2>
                <button onClick={() => setIsCreating(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-[10px]">Note Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Organic Chemistry Reactions"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-[10px]">Subject / Class</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Chemistry"
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label text-[10px]">Tags (comma separated)</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="exam, reactions, chapter4"
                    className="input pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label text-[10px]">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste lecture notes or type here..."
                  className="input min-h-[300px] text-sm leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsCreating(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} className="btn-primary">
                  <Check className="w-4 h-4" /> Save Note
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: AI Tools */}
          <div className="lg:w-96 space-y-4">
            <div className="card p-1.5 flex gap-1 bg-neutral-100 dark:bg-neutral-800">
              <button
                onClick={() => setActiveTool('summary')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTool === 'summary' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600' : 'text-neutral-500'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Summary
              </button>
              <button
                onClick={() => setActiveTool('flashcards')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTool === 'flashcards' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600' : 'text-neutral-500'
                }`}
              >
                <Layers className="w-4 h-4" /> Cards
              </button>
              <button
                onClick={() => setActiveTool('quiz')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTool === 'quiz' ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600' : 'text-neutral-500'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Quiz
              </button>
            </div>

            <div className="animate-fade-in" key={activeTool}>
              {activeTool === 'summary' && (
                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 text-primary-600">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold text-sm">AI Study Summary</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30">
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                        {aiSummary.overview}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Key Takeaways</p>
                      <ul className="space-y-1.5">
                        {aiSummary.keyPoints.map((p, i) => (
                          <li key={i} className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                            <span className="text-primary-500 font-bold">•</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {aiSummary.terms.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Vocabulary</p>
                        <div className="space-y-2">
                          {aiSummary.terms.map((t, i) => (
                            <div key={i} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white">{t.term}</p>
                              <p className="text-[11px] text-neutral-500 mt-0.5">{t.definition}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTool === 'flashcards' && (
                <div className="space-y-4">
                  <FlashcardDeck flashcards={aiFlashcards} />
                  <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
                      <Brain className="w-4 h-4" />
                      <p className="text-xs font-bold">Active Recall Tip</p>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Don't just read the back! Try to vocalize the answer before flipping to strengthen neural pathways.
                    </p>
                  </div>
                </div>
              )}

              {activeTool === 'quiz' && (
                <div className="space-y-4">
                  <QuizRunner questions={aiQuiz} />
                  <div className="p-4 rounded-2xl bg-success-50 dark:bg-success-950/20 border border-success-100 dark:border-success-900/30">
                    <div className="flex items-center gap-2 text-success-600 dark:text-success-400 mb-1">
                      <HelpCircle className="w-4 h-4" />
                      <p className="text-xs font-bold">Practice Testing</p>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Generating questions from notes is one of the most effective ways to prep for standardized exams.
                    </p>
                  </div>
                </div>
              )}

              {activeTool === 'content' && (
                <div className="card p-8 text-center text-neutral-400 space-y-3">
                  <Bot className="w-10 h-10 mx-auto opacity-50" />
                  <p className="text-xs font-medium">Select an AI tool above to generate study aids from your content.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}