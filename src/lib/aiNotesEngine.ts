export type AISummary = {
  overview: string;
  keyPoints: string[];
  terms: { term: string; definition: string }[];
  studyTips: string[];
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

/**
 * Generates structured AI summary from raw note content.
 */
export function generateNoteSummary(content: string, title: string): AISummary {
  const clean = content.trim();
  if (!clean) {
    return {
      overview: 'No note content provided yet.',
      keyPoints: ['Add details to your note to generate a summary.'],
      terms: [],
      studyTips: ['Take bullet points during lectures or reading.'],
    };
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
    .filter((s) => s.length > 8);

  const overview = sentences.length > 0
    ? `Summary for "${title}": Covers ${sentences.slice(0, 2).join(' ')}`
    : `Overview of ${title}.`;

  const keyPoints: string[] = [];
  sentences.forEach((s) => {
    if (keyPoints.length < 5 && s.length > 15) {
      keyPoints.push(s);
    }
  });

  if (keyPoints.length === 0) {
    keyPoints.push(clean.slice(0, 100) + '...');
  }

  // Extract term/definitions (lines or sentences containing 'is', 'means', 'defined as', or ':')
  const terms: { term: string; definition: string }[] = [];
  const lines = clean.split('\n');

  lines.forEach((line) => {
    if (terms.length >= 4) return;
    if (line.includes(':')) {
      const [term, def] = line.split(':');
      if (term && def && term.trim().length < 30) {
        terms.push({ term: term.trim(), definition: def.trim() });
      }
    } else if (/\bis\b|\brefers to\b|\bmeans\b/i.test(line)) {
      const match = line.match(/(.*?)\s+(?:is|refers to|means)\s+(.*)/i);
      if (match && match[1] && match[2] && match[1].length < 30) {
        terms.push({ term: match[1].trim(), definition: match[2].trim() });
      }
    }
  });

  const studyTips = [
    'Review these key bullet points 24 hours after taking the note.',
    'Use the generated Flashcards tab to test active recall.',
    'Take the Practice Quiz to test your mastery before exams.',
  ];

  return {
    overview,
    keyPoints,
    terms,
    studyTips,
  };
}

/**
 * Auto-generates flashcards from note sentences and definitions.
 */
export function generateFlashcards(content: string): Flashcard[] {
  const clean = content.trim();
  if (!clean) return [];

  const flashcards: Flashcard[] = [];
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  lines.forEach((line, index) => {
    if (flashcards.length >= 10) return;

    if (line.includes(':')) {
      const [front, back] = line.split(':');
      if (front && back && front.length > 2) {
        flashcards.push({
          id: `fc-${index}-${Date.now()}`,
          front: `What is ${front.trim()}?`,
          back: back.trim(),
        });
      }
    } else if (/\bis\b/i.test(line)) {
      const match = line.match(/(.*?)\s+is\s+(.*)/i);
      if (match && match[1] && match[2] && match[1].length < 35) {
        flashcards.push({
          id: `fc-${index}-${Date.now()}`,
          front: `Define: ${match[1].trim()}`,
          back: match[2].trim(),
        });
      }
    } else if (line.length > 25 && !line.startsWith('#')) {
      flashcards.push({
        id: `fc-${index}-${Date.now()}`,
        front: `Explain concept: "${line.slice(0, 45)}..."`,
        back: line,
      });
    }
  });

  if (flashcards.length < 2) {
    // Fallback split sentences
    const sentences = clean.split(/[.!?]/).filter((s) => s.trim().length > 15);
    sentences.forEach((s, idx) => {
      if (flashcards.length >= 5) return;
      flashcards.push({
        id: `fc-fallback-${idx}`,
        front: `Key Concept ${idx + 1}`,
        back: s.trim(),
      });
    });
  }

  return flashcards;
}

/**
 * Auto-generates multiple choice practice quiz questions based on note text.
 */
export function generatePracticeQuiz(content: string, noteTitle: string): QuizQuestion[] {
  const clean = content.trim();
  if (!clean) return [];

  const questions: QuizQuestion[] = [];
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
    .filter((s) => s.length > 20);

  sentences.forEach((sentence, idx) => {
    if (questions.length >= 5) return;

    // Check if sentence has key definition or statement
    const words = sentence.split(' ');
    if (words.length >= 5) {
      const targetWord = words[Math.floor(words.length / 2)].replace(/[^a-zA-Z]/g, '');

      if (targetWord.length > 3) {
        const masked = sentence.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '_____');

        const distractors = ['Primary Concept', 'Secondary Factor', 'System Analysis', 'Variable State']
          .filter((d) => d.toLowerCase() !== targetWord.toLowerCase());

        const options = [targetWord, distractors[0], distractors[1], distractors[2]];
        // Shuffle options and find index of target
        const shuffled = [...options].sort(() => 0.5 - Math.random());
        const correctIndex = shuffled.indexOf(targetWord);

        questions.push({
          id: `q-${idx}-${Date.now()}`,
          question: `Fill in the blank: "${masked}"`,
          options: shuffled,
          correctAnswer: correctIndex,
          explanation: `Full statement from note: "${sentence}"`,
        });
      }
    }
  });

  if (questions.length === 0 && clean.length > 10) {
    questions.push({
      id: `q-fallback-1`,
      question: `What is the main subject discussed in "${noteTitle}"?`,
      options: [noteTitle, 'Unrelated Subject', 'General Notes', 'System Process'],
      correctAnswer: 0,
      explanation: `This note specifically discusses ${noteTitle}.`,
    });
  }

  return questions;
}