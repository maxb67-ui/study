import { useState } from 'react';
import { RotateCw, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Shuffle, Sparkles, RefreshCcw } from 'lucide-react';
import type { Flashcard } from '@/lib/aiNotesEngine';

export function FlashcardDeck({ flashcards, onFinish }: { flashcards: Flashcard[]; onFinish?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [needsReview, setNeedsReview] = useState<Set<string>>(new Set());

  if (flashcards.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Sparkles className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">No flashcards available</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Add more content to your note to generate flashcards.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const isFinished = known.size + needsReview.size === flashcards.length;

  function markCard(knownStatus: boolean) {
    const id = currentCard.id;
    if (knownStatus) {
      setKnown((prev) => new Set(prev).add(id));
      setNeedsReview((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } else {
      setNeedsReview((prev) => new Set(prev).add(id));
      setKnown((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }

    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function resetDeck() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown(new Set());
    setNeedsReview(new Set());
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>Card {currentIndex + 1} of {flashcards.length}</span>
        <div className="flex gap-3">
          <span className="text-success-600 dark:text-success-400 font-medium">Got it: {known.size}</span>
          <span className="text-error-600 dark:text-error-400 font-medium">Review: {needsReview.size}</span>
        </div>
      </div>

      {/* Flashcard container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="card p-8 min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 transition-all shadow-md relative group select-none"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 absolute top-4 left-4">
          {isFlipped ? 'Answer' : 'Question / Concept'}
        </span>

        <p className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white max-w-lg leading-relaxed">
          {isFlipped ? currentCard.back : currentCard.front}
        </p>

        <div className="absolute bottom-4 flex items-center gap-1 text-xs text-primary-500 font-medium group-hover:scale-105 transition-transform">
          <RotateCw className="w-3.5 h-3.5" />
          <span>Click to flip</span>
        </div>
      </div>

      {/* Action controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => { setIsFlipped(false); setCurrentIndex((i) => Math.max(0, i - 1)); }}
          disabled={currentIndex === 0}
          className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          Prev
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => markCard(false)}
            className="btn bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400 hover:bg-error-100 px-4 py-2 text-xs font-semibold"
          >
            <XCircle className="w-4 h-4" />
            Needs Review
          </button>
          <button
            onClick={() => markCard(true)}
            className="btn bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400 hover:bg-success-100 px-4 py-2 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4" />
            Got It!
          </button>
        </div>

        <button
          onClick={() => { setIsFlipped(false); setCurrentIndex((i) => Math.min(flashcards.length - 1, i + 1)); }}
          disabled={currentIndex === flashcards.length - 1}
          className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {isFinished && (
        <div className="card p-4 bg-success-50 dark:bg-success-950/20 border-success-200 dark:border-success-800 text-center animate-slide-up">
          <p className="font-bold text-sm text-success-800 dark:text-success-200">Deck Completed! 🎉</p>
          <p className="text-xs text-success-700 dark:text-success-300 mt-1">
            You mastered {known.size} out of {flashcards.length} cards.
          </p>
          <button onClick={resetDeck} className="btn-secondary text-xs mt-3 mx-auto">
            <RefreshCcw className="w-3.5 h-3.5" />
            Restart Deck
          </button>
        </div>
      )}
    </div>
  );
}