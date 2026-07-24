import { useState, useMemo } from 'react';
import {
  X, RotateCw, CheckCircle2, XCircle, Sparkles, Brain, Award, ChevronLeft, ChevronRight,
  HelpCircle, Shuffle, Zap, Layers, Trophy, BookOpen, Repeat
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  options?: string[]; // for quiz mode
  correctOptionIndex?: number;
  explanation?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  cards: Flashcard[];
};

export function FlashcardsModal({ isOpen, onClose, title, subject, cards: initialCards }: Props) {
  const toast = useToast();
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
      toast('success', `Session complete! Earned +50 XP 🎉`);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
    toast('info', 'Flashcards shuffled!');
  };

  const handleGrade = (confidence: 'hard' | 'good' | 'easy') => {
    setReviewedCount((prev) => prev + 1);
    handleNext();
  };

  const handleAnswerQuiz = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const correct = currentCard.correctOptionIndex === index || index === 0;
    if (correct) {
      setQuizScore((prev) => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setCompleted(false);
    setReviewedCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="card w-full max-w-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-glow-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md">{title}</h2>
              <p className="text-xs text-primary-500 font-bold uppercase tracking-wider">{subject} · {cards.length} Cards</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === 'flashcards' ? 'quiz' : 'flashcards')}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {mode === 'flashcards' ? <Zap className="w-3.5 h-3.5 text-amber-500" /> : <Layers className="w-3.5 h-3.5 text-primary-500" />}
              {mode === 'flashcards' ? 'Quiz Mode' : 'Cards Mode'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[360px]">
          {completed ? (
            <div className="text-center py-8 animate-scale-in">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-400 text-white mx-auto flex items-center justify-center shadow-glow-accent mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Deck Completed!</h3>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                {mode === 'quiz' ? `You scored ${quizScore} / ${cards.length} correct!` : `You reviewed all ${cards.length} study cards.`}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 font-bold text-xs mt-4">
                <Sparkles className="w-4 h-4" /> +50 Lumora XP Earned
              </div>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={handleRestart} className="btn-primary">
                  <Repeat className="w-4 h-4" /> Study Again
                </button>
                <button onClick={onClose} className="btn-secondary">
                  Done
                </button>
              </div>
            </div>
          ) : mode === 'flashcards' ? (
            /* 3D Flashcard Player */
            <div className="w-full flex flex-col items-center space-y-6">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full h-64 sm:h-72 cursor-pointer perspective-1000"
              >
                <div
                  className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Card Front */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl p-8 bg-gradient-to-br from-white to-primary-50/50 dark:from-neutral-900 dark:to-primary-950/30 border-2 border-primary-200/80 dark:border-primary-800/60 shadow-xl flex flex-col items-center justify-center text-center backface-hidden">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-500 mb-3">Question / Term</span>
                    <p className="text-lg sm:text-2xl font-extrabold text-neutral-900 dark:text-white leading-relaxed">
                      {currentCard?.front}
                    </p>
                    <span className="mt-auto text-xs font-semibold text-neutral-400 flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" /> Tap or press Space to reveal answer
                    </span>
                  </div>

                  {/* Card Back */}
                  <div className="absolute inset-0 w-full h-full rounded-3xl p-8 bg-gradient-to-br from-indigo-900 to-primary-950 text-white border-2 border-primary-400/80 shadow-xl flex flex-col items-center justify-center text-center rotate-y-180 backface-hidden">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent-400 mb-3">Answer / Concept</span>
                    <p className="text-base sm:text-xl font-bold leading-relaxed text-neutral-100">
                      {currentCard?.back}
                    </p>
                    <span className="mt-auto text-xs font-semibold text-white/60">
                      Rate your memory recall below
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Rating Controls */}
              {isFlipped ? (
                <div className="grid grid-cols-3 gap-3 w-full animate-fade-in">
                  <button
                    onClick={() => handleGrade('hard')}
                    className="py-2.5 px-3 rounded-2xl bg-error-50 dark:bg-error-950/40 text-error-600 dark:text-error-400 border border-error-200/60 font-bold text-xs hover:bg-error-100 transition-all"
                  >
                    😅 Hard
                  </button>
                  <button
                    onClick={() => handleGrade('good')}
                    className="py-2.5 px-3 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200/60 font-bold text-xs hover:bg-primary-100 transition-all"
                  >
                    👍 Good
                  </button>
                  <button
                    onClick={() => handleGrade('easy')}
                    className="py-2.5 px-3 rounded-2xl bg-success-50 dark:bg-success-950/40 text-success-600 dark:text-success-400 border border-success-200/60 font-bold text-xs hover:bg-success-100 transition-all"
                  >
                    🚀 Easy
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="btn-secondary text-xs disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button onClick={handleShuffle} className="btn-ghost text-xs text-neutral-500">
                    <Shuffle className="w-3.5 h-3.5" /> Shuffle
                  </button>
                  <button onClick={handleNext} className="btn-primary text-xs">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Mode */
            <div className="w-full space-y-5 animate-fade-in">
              <div className="p-5 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80">
                <span className="text-[10px] font-extrabold uppercase text-primary-500 tracking-wider">Question {currentIndex + 1} of {cards.length}</span>
                <p className="text-base font-bold text-neutral-900 dark:text-white mt-1">{currentCard?.front}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {(currentCard.options || [
                  currentCard.back,
                  `Alternative statement B regarding ${subject}`,
                  `Incorrect concept variant C`,
                  `Opposite theory D`,
                ]).map((opt, i) => {
                  const isCorrect = i === (currentCard.correctOptionIndex ?? 0);
                  const isSelected = selectedAnswer === i;
                  let style = 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200';

                  if (selectedAnswer !== null) {
                    if (isCorrect) {
                      style = 'bg-success-50 dark:bg-success-950/50 border-success-500 text-success-900 dark:text-success-200 font-bold';
                    } else if (isSelected) {
                      style = 'bg-error-50 dark:bg-error-950/50 border-error-500 text-error-900 dark:text-error-200 font-bold';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswerQuiz(i)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-sm transition-all flex items-center justify-between ${style}`}
                    >
                      <span>{opt}</span>
                      {selectedAnswer !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />}
                      {selectedAnswer !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-error-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation popup */}
              {showExplanation && (
                <div className="p-4 rounded-2xl bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 text-xs text-primary-900 dark:text-primary-200 animate-slide-up">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-primary-600 dark:text-primary-400">
                    <Sparkles className="w-3.5 h-3.5" /> Lumora AI Explanation
                  </p>
                  <p>{currentCard.explanation || `The correct answer is "${currentCard.back}". Review this concept in your notes for complete mastery.`}</p>
                </div>
              )}

              {selectedAnswer !== null && (
                <button onClick={handleNext} className="btn-primary w-full py-3">
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Progress Bar */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <div className="w-32 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}