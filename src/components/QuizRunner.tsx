import { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCcw, HelpCircle, ArrowRight } from 'lucide-react';
import type { QuizQuestion } from '@/lib/aiNotesEngine';

export function QuizRunner({ questions }: { questions: QuizQuestion[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="card p-8 text-center">
        <HelpCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">No practice questions generated</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Add more content to your note to create practice quizzes.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  function handleSelect(index: number) {
    if (answered) return;
    setSelectedOption(index);
    setAnswered(true);

    if (index === currentQ.correctAnswer) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setCompleted(true);
    }
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setAnswered(false);
    setCompleted(false);
  }

  if (completed) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="card p-6 text-center animate-scale-in">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-primary-500" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Quiz Completed!</h3>
        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">{pct}% Score</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {score} out of {questions.length} questions correct
        </p>

        <button onClick={restartQuiz} className="btn-primary text-xs mt-5 mx-auto">
          <RefreshCcw className="w-4 h-4" />
          Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>Score: {score}/{questions.length}</span>
      </div>

      <div className="card p-5 space-y-4">
        <p className="font-semibold text-base text-neutral-900 dark:text-white">{currentQ.question}</p>

        <div className="space-y-2">
          {currentQ.options.map((option, idx) => {
            let style = 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200';

            if (answered) {
              if (idx === currentQ.correctAnswer) {
                style = 'bg-success-50 dark:bg-success-950/30 border-success-500 text-success-700 dark:text-success-300 font-semibold';
              } else if (idx === selectedOption) {
                style = 'bg-error-50 dark:bg-error-950/30 border-error-500 text-error-700 dark:text-error-300 font-semibold';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${style}`}
              >
                <span>{option}</span>
                {answered && idx === currentQ.correctAnswer && <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />}
                {answered && idx === selectedOption && idx !== currentQ.correctAnswer && <XCircle className="w-4 h-4 text-error-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 animate-slide-up">
            <span className="font-semibold block mb-0.5">Explanation:</span>
            {currentQ.explanation}
          </div>
        )}
      </div>

      {answered && (
        <div className="flex justify-end">
          <button onClick={handleNext} className="btn-primary text-xs">
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}