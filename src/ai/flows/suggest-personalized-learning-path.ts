'use server';
/**
 * @fileOverview Provides personalized learning path suggestions based on a student's initial assessment.
 *
 * - suggestPersonalizedLearningPath - A function that suggests personalized learning paths.
 * - SuggestPersonalizedLearningPathInput - The input type for the suggestPersonalizedLearningPath function.
 * - SuggestPersonalizedLearningPathOutput - The return type for the suggestPersonalizedLearningPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPersonalizedLearningPathInputSchema = z.object({
  assessmentResults: z.record(z.number()).describe('A record of assessment results for different subjects.  Keys are subjects, values are scores.'),
  availableCourses: z.array(z.string()).describe('A list of available courses.'),
});

export type SuggestPersonalizedLearningPathInput = z.infer<typeof SuggestPersonalizedLearningPathInputSchema>;

const SuggestPersonalizedLearningPathOutputSchema = z.object({
  suggestedLearningPaths: z.array(z.string()).describe('A list of suggested learning paths based on the assessment results.'),
});

export type SuggestPersonalizedLearningPathOutput = z.infer<typeof SuggestPersonalizedLearningPathOutputSchema>;

export async function suggestPersonalizedLearningPath(
  input: SuggestPersonalizedLearningPathInput
): Promise<SuggestPersonalizedLearningPathOutput> {
  return suggestPersonalizedLearningPathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPersonalizedLearningPathPrompt',
  input: {schema: SuggestPersonalizedLearningPathInputSchema},
  output: {schema: SuggestPersonalizedLearningPathOutputSchema},
  prompt: `Based on the student's assessment results and available courses, suggest personalized learning paths.

Assessment Results: {{{assessmentResults}}}
Available Courses: {{{availableCourses}}}

Suggested Learning Paths:`,
});

const suggestPersonalizedLearningPathFlow = ai.defineFlow(
  {
    name: 'suggestPersonalizedLearningPathFlow',
    inputSchema: SuggestPersonalizedLearningPathInputSchema,
    outputSchema: SuggestPersonalizedLearningPathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
