'use server';

import { suggestPersonalizedLearningPath, type SuggestPersonalizedLearningPathInput, type SuggestPersonalizedLearningPathOutput } from '@/ai/flows/suggest-personalized-learning-path';

const availableCourses = [
  "Algebra Fundamentals", "World History", "English Grammar", "Intro to Physics", "Logical Puzzles", "Geometry Basics", "Current Affairs", "Advanced Chemistry", "Vocabulary Expansion", "Critical Reading", "Basic Biology", "Indian Polity"
];

export async function getLearningPath(
  assessmentResults: Record<string, number>
): Promise<SuggestPersonalizedLearningPathOutput> {
  const input: SuggestPersonalizedLearningPathInput = {
    assessmentResults,
    availableCourses,
  };

  try {
    const result = await suggestPersonalizedLearningPath(input);
    return result;
  } catch (error) {
    console.error("Error generating learning path:", error);
    return { suggestedLearningPaths: ["An error occurred while generating your learning path. Please try again."] };
  }
}
