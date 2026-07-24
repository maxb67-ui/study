import type { Profile } from './supabase';

export type TutorMode = 'explain' | 'step_by_step' | 'practice' | 'study_guide';

export type TutorMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  mode?: TutorMode;
  subject?: string;
  timestamp: string;
  structuredData?: {
    steps?: { stepNumber: number; title: string; detail: string }[];
    questions?: { question: string; options?: string[]; answer: string; explanation: string }[];
    studyGuide?: { overview: string; keyTerms: { term: string; def: string }[]; coreConcepts: string[]; reviewQuestions: string[] };
  };
};

/**
 * Synthesizes AI Tutor responses tailored to grade level, subject, and mode.
 */
export function generateTutorResponse(
  query: string,
  mode: TutorMode,
  subject: string,
  profile: Profile | null,
): { text: string; structuredData?: TutorMessage['structuredData'] } {
  const gradeLevel = profile?.grade_level || 'AP / Honors';
  const learningStyle = profile?.learning_style || 'visual';
  const cleanQuery = query.trim();

  const isMathOrScience = /math|calculus|algebra|geometry|physics|chemistry|biology/i.test(subject) ||
    /\d+|\+|-|\*|\/|=|\^|x|y|equation|solve/i.test(cleanQuery);

  if (mode === 'step_by_step') {
    return generateStepByStep(cleanQuery, subject, gradeLevel, learningStyle, isMathOrScience);
  }

  if (mode === 'practice') {
    return generatePracticeQuestions(cleanQuery, subject, gradeLevel);
  }

  if (mode === 'study_guide') {
    return generateStudyGuide(cleanQuery, subject, gradeLevel);
  }

  // Default: Explain mode
  return generateExplanation(cleanQuery, subject, gradeLevel, learningStyle);
}

function generateExplanation(
  query: string,
  subject: string,
  gradeLevel: string,
  learningStyle: string,
) {
  const isElementaryOrMiddle = /middle|freshman/i.test(gradeLevel);
  const isAdvanced = /ap|undergraduate|graduate/i.test(gradeLevel);

  let toneNotice = isElementaryOrMiddle
    ? `💡 **Grade Level Explanation (${gradeLevel}):** Let's break this down simply with clear real-world examples!`
    : isAdvanced
    ? `🎓 **Advanced Analysis (${gradeLevel}):** Here is a rigorous, structured breakdown tailored for high academic achievement.`
    : `📚 **Standard Explanation (${gradeLevel}):** Here is a comprehensive overview of the concept.`;

  let learningTip = learningStyle === 'visual'
    ? '\n\n🎨 **Visual Analogy:** Picture this as a flowchart or building blocks where each part connects directly to the next.'
    : learningStyle === 'kinesthetic'
    ? '\n\n✋ **Practical Application:** Try sketching or testing this out with a quick hands-on example.'
    : '';

  const text = `${toneNotice}

### Key Concept: ${query}
*Subject: ${subject}*

1. **Core Summary:**
   At its core, **${query}** represents a fundamental principle in ${subject}. It explains how key components interact and influence outcomes.

2. **Why It Matters:**
   Understanding this topic allows you to connect individual facts into a bigger picture, making exam questions and problem sets much easier to solve.

3. **Real-World Analogy:**
   Think of ${query} like a standard mechanical system: each input yields a predictable output based on consistent rules.

4. **Exam Pro-Tip:**
   Watch out for trick questions that test edge cases! Always check your underlying assumptions and units.${learningTip}

Would you like me to generate **Practice Questions** or provide a **Step-by-Step Problem Breakdown** on this topic?`;

  return { text };
}

function generateStepByStep(
  query: string,
  subject: string,
  gradeLevel: string,
  learningStyle: string,
  isMathOrScience: boolean,
) {
  const steps = [
    {
      stepNumber: 1,
      title: 'Identify Given Information & Variables',
      detail: `Carefully read "${query}". Highlight the known values, target outcome, and constraints for ${subject}.`,
    },
    {
      stepNumber: 2,
      title: 'Select the Governing Rule or Formula',
      detail: isMathOrScience
        ? 'State the governing theorem or formula. Isolate the target variable before substituting numbers.'
        : 'Formulate your core thesis statement or framework to address the question.',
    },
    {
      stepNumber: 3,
      title: 'Execute Calculations / Logical Reasoning',
      detail: 'Substitute known values step-by-step. Keep work clean and double-check unit conversions at each line.',
    },
    {
      stepNumber: 4,
      title: 'Verify Answer & Sanity Check',
      detail: `Does the result make sense intuitively at the ${gradeLevel} level? Check bounds and signs.`,
    },
  ];

  const text = `🎯 **Step-by-Step Solution Breakdown (${gradeLevel})**
*Topic: "${query}" in ${subject}*

Follow this structured approach to solve the problem systematically:

${steps.map((s) => `**Step ${s.stepNumber}: ${s.title}**\n${s.detail}`).join('\n\n')}

Need further clarification on any specific step above?`;

  return { text, structuredData: { steps } };
}

function generatePracticeQuestions(query: string, subject: string, gradeLevel: string) {
  const questions = [
    {
      question: `Which of the following best describes the core principle of ${query || subject}?`,
      options: [
        'A) It operates on constant linear proportionality.',
        'B) It describes dynamic equilibrium under changing conditions.',
        'C) It is an independent variable unaffected by external factors.',
        'D) It applies exclusively to isolated theoretical models.',
      ],
      answer: 'B) It describes dynamic equilibrium under changing conditions.',
      explanation: 'Key systems maintain balance by responding dynamically to inputs.',
    },
    {
      question: `In a standard ${gradeLevel} ${subject} problem involving ${query || 'this topic'}, what is the most common student pitfall?`,
      options: [
        'A) Misinterpreting key units or baseline conditions.',
        'B) Performing algebraic calculations too quickly.',
        'C) Forgetting basic vocabulary terms.',
        'D) Ignoring given parameters completely.',
      ],
      answer: 'A) Misinterpreting key units or baseline conditions.',
      explanation: 'Most missed points stem from misreading initial boundary conditions.',
    },
  ];

  const text = `📝 **Practice Questions for ${gradeLevel} ${subject}**
*Topic: ${query || 'General Review'}*

Test your active recall below! Reveal the answers when you're ready:`;

  return { text, structuredData: { questions } };
}

function generateStudyGuide(query: string, subject: string, gradeLevel: string) {
  const studyGuide = {
    overview: `Comprehensive ${gradeLevel} Exam Prep Guide for ${query || subject}`,
    keyTerms: [
      { term: 'Primary Axiom', def: 'The fundamental principle accepted as baseline for problem solving.' },
      { term: 'Boundary Condition', def: 'The specific limits under which a formula or theory holds true.' },
      { term: 'Rate of Change', def: 'How quickly one variable shifts relative to another.' },
    ],
    coreConcepts: [
      'Master the core formulas before attempting complex multi-step problems.',
      'Group related terms and draw connection diagrams for memory retention.',
      'Practice active recall: quiz yourself without looking at notes first.',
    ],
    reviewQuestions: [
      `How does ${query} interact with secondary factors in ${subject}?`,
      'What are two real-world examples where this concept applies?',
      'How would you explain this topic to a fellow classmate?',
    ],
  };

  const text = `📖 **Study Guide Generated (${gradeLevel})**
*Subject: ${subject} | Topic: ${query || 'Semester Review'}*

---
### 1. Key Terminology
${studyGuide.keyTerms.map((k) => `• **${k.term}:** ${k.def}`).join('\n')}

---
### 2. High-Yield Concepts
${studyGuide.coreConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---
### 3. Self-Test Review Questions
${studyGuide.reviewQuestions.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}
`;

  return { text, structuredData: { studyGuide } };
}