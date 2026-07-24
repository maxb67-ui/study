import { useState } from 'react';
import {
  BookMarked, Plus, Search, Tag, Sparkles, Trash2, Edit3, Calendar,
  Bot, Check, FileText, Share2, Layers, Brain
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Note, NoteInput } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FlashcardsModal, type Flashcard } from '@/components/FlashcardsModal';

export function NotesView(props: NavProps) {
  const { notes, onSaveNote, onDeleteNote, loading, setView } = props;
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Flashcards state
  const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
  const [activeDeckTitle, setActiveDeckTitle] = useState('');
  const [activeDeckSubject, setActiveDeckSubject] = useState('');
  const [activeDeckCards, setActiveDeckCards] = useState<Flashcard[]>([]);

  const subjects = Array.from(new Set(notes.map((n) => n.subject))).filter(Boolean);

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
    setIsCreating(true);
  }

  function startEdit(note: Note) {
    setEditingNote(note);
    setTitle(note.title);
    setSubject(note.subject);
    setContent(note.content);
    setTagsInput(note.tags.join(', '));
    setIsCreating(true);
  }

  function handleSave() {
    const cleanTitle = title.trim().slice(0, 200);
    const cleanSubject = subject.trim().slice(0, 100);
    const cleanContent = content.slice(0, 20000);

    if (!cleanTitle) {
      toast('error', 'Note title is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().slice(0, 30))
      .filter(Boolean)
      .slice(0, 10);

    const input: NoteInput = {
      title: cleanTitle,
      subject: cleanSubject || 'General',
      content: cleanContent,
      tags,
    };

    onSaveNote(input, editingNote?.id);
    setIsCreating(false);
  }

  function handleAiSummarize() {
    if (!content.trim()) {
      toast('info', 'Add note content first to generate AI summary & key terms');
      return;
    }
    setAiGenerating(true);
    setTimeout(() => {
      const summary = `\n\n✨ **AI Summary & Key Concepts**:\n- High yield concept breakdown for ${subject}.\n- Core formula / rule applied in active context.\n- Main exam takeaway: Focus on definitions and practical examples.`;
      setContent((prev) => (prev + summary).slice(0, 20000));
      setAiGenerating(false);
      toast('success', 'AI Summary generated!');
    }, 800);
  }

  function openFlashcardsForNote(note: Note) {
    setActiveDeckTitle(note.title);
    setActiveDeckSubject(note.subject);

    const sampleCards: Flashcard[] = [
      {
        id: '1',
        front: `What is the core definition in "${note.title}"?`,
        back: note.content.slice(0, 150) || `Key concepts regarding ${note.subject}.`,
        explanation: `Extracted directly from note: ${note.title}.`,
      },
      {
        id: '2',
        front: `Key applications of ${note.subject} concepts`,
        back: `Primary principle governing ${note.subject} problem solving and theoretical framework.`,
      },
      {
        id: '3',
        front: `Common exam trick for ${note.title}`,
        back: `Remember to verify initial boundary conditions and double check units.`,
      },
    ];

    setActiveDeckCards(sampleCards);
    setFlashcardModalOpen(true);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookMarked className="w-7 h-7 text-primary-500" />
            Class Notes & Flashcards
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            Organize study notes, AI-generated summaries, and instant flashcard decks.
          </p>
        </div>

        <button onClick={startCreate} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Create Note
        </button>
      </div>

      <div className="card p-4 mb-6 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
          <input
            type="text"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes content, titles, or #tags..."
            className="input pl-10 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedSubject === 'all'
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedSubject === sub
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {isCreating && (
        <div className="card p-6 mb-8 animate-scale-in border-2 border-primary-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-neutral-900 dark:text-white">
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </h2>
            <button
              onClick={handleAiSummarize}
              disabled={aiGenerating}
              className="btn-secondary text-xs px-3 py-1.5 text-primary-600 dark:text-primary-400"
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
              {aiGenerating ? 'Generating Summary...' : 'AI Enhance'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Reactions"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Subject</label>
                <input
                  type="text"
                  maxLength={100}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Chemistry"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Tags (comma separated)</label>
              <input
                type="text"
                maxLength={200}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="exam, reactions, chapter4"
                className="input"
              />
            </div>

            <div>
              <label className="label">Note Content</label>
              <textarea
                rows={6}
                maxLength={20000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type lecture notes, concepts, and key definitions..."
                className="input font-mono text-xs sm:text-sm leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setIsCreating(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary">
                <Check className="w-4 h-4" /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredNotes.length === 0 ? (
        <div className="card p-12 text-center">
          <BookMarked className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">No notes found</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 mb-4">
            Create a note to start organizing lectures and AI flashcards.
          </p>
          <button onClick={startCreate} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create First Note
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="card p-5 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-500">
                      {note.subject}
                    </span>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white mt-0.5">
                      {note.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Edit Note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/40"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-4 whitespace-pre-wrap font-sans leading-relaxed mb-4">
                  {note.content || 'No content provided.'}
                </p>
              </div>

              <div>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-medium">
                    Updated {new Date(note.updated_at).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => openFlashcardsForNote(note)}
                    className="btn-secondary text-xs px-3 py-1.5 text-primary-600 dark:text-primary-400 font-bold"
                  >
                    <Brain className="w-3.5 h-3.5 text-accent-500" />
                    Practice Deck
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FlashcardsModal
        isOpen={flashcardModalOpen}
        onClose={() => setFlashcardModalOpen(false)}
        title={activeDeckTitle}
        subject={activeDeckSubject}
        cards={activeDeckCards}
      />
    </div>
  );
}