
'use server';
/**
 * @fileOverview Generates AI-powered practice tests.
 *
 * - generateAiTest - A function that creates a practice test based on user specifications.
 * - GenerateAiTestInput - The input type for the function.
 * - GenerateAiTestOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAiTestInputSchema = z.object({
  subject: z.string().describe('The subject of the test (e.g., Maths, History).'),
  examType: z.string().describe('The type of competitive exam (e.g., UPSC, Sainik School).'),
  language: z.string().describe('The language for the test questions (e.g., English, Hindi).'),
  testType: z.enum(['Multiple Choice', 'Written Answer']).describe('The format of the test questions.'),
  questionCount: z.number().min(1).max(50).default(5).describe('The number of questions to generate.'),
});
export type GenerateAiTestInput = z.infer<typeof GenerateAiTestInputSchema>;

const MultipleChoiceQuestionSchema = z.object({
    question: z.string().describe("The question text."),
    options: z.array(z.string()).length(4).describe("An array of exactly four possible answers."),
    correctAnswerIndex: z.number().min(0).max(3).describe("The index (0-3) of the correct answer in the options array.")
});

const GenerateAiTestOutputSchema = z.object({
  questions: z.array(MultipleChoiceQuestionSchema).describe('A list of generated multiple-choice questions.'),
});
export type GenerateAiTestOutput = z.infer<typeof GenerateAiTestOutputSchema>;

export async function generateAiTest(
  input: GenerateAiTestInput
): Promise<GenerateAiTestOutput> {
  return generateAiTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiTestPrompt',
  input: { schema: GenerateAiTestInputSchema },
  output: { schema: GenerateAiTestOutputSchema },
  prompt: `You are an expert test creator for competitive exams. Your task is to generate a practice test based on the user's specifications.

The test, including all questions and options, must be entirely in the requested language: {{{language}}}.

Subject: {{{subject}}}
Exam Type: {{{examType}}}
Language: {{{language}}}
Question Format: {{{testType}}}
Number of Questions: {{{questionCount}}}

Please generate exactly {{{questionCount}}} high-quality, relevant multiple-choice questions. Each question must have exactly four options and a clearly identified correct answer index. 
`,
});


const generateAiTestFlow = ai.defineFlow(
  {
    name: 'generateAiTestFlow',
    inputSchema: GenerateAiTestInputSchema,
    outputSchema: GenerateAiTestOutputSchema,
  },
  async (input) => {
    // For now, we only support Multiple Choice, but this structure allows for future expansion.
    if (input.testType !== 'Multiple Choice') {
        throw new Error("Currently, only 'Multiple Choice' test types are supported.");
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);
