'use server';
/**
 * @fileOverview Suggests the top 10 students based on their performance and activity.
 *
 * - suggestTopStudents - A function that returns a list of top 10 student UIDs.
 * - SuggestTopStudentsInput - The input type for the function.
 * - SuggestTopStudentsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudentDataSchema = z.object({
    uid: z.string(),
    displayName: z.string().optional(),
    rewardPoints: z.number().default(0),
    coursesCompleted: z.number().default(0),
    testsTaken: z.number().default(0),
    lastLogin: z.string().optional(),
});

const SuggestTopStudentsInputSchema = z.object({
  students: z.array(StudentDataSchema).describe("A list of all students and their relevant data."),
});
export type SuggestTopStudentsInput = z.infer<typeof SuggestTopStudentsInputSchema>;


const SuggestTopStudentsOutputSchema = z.object({
  topStudentUids: z.array(z.string()).length(10).describe('An array of exactly 10 student UIDs, ranked from 1 to 10.'),
});
export type SuggestTopStudentsOutput = z.infer<typeof SuggestTopStudentsOutputSchema>;


export async function suggestTopStudents(input: SuggestTopStudentsInput): Promise<SuggestTopStudentsOutput> {
  // In a real scenario, you might want to pre-process or fetch more data here.
  return suggestTopStudentsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'suggestTopStudentsPrompt',
  input: { schema: SuggestTopStudentsInputSchema },
  output: { schema: SuggestTopStudentsOutputSchema },
  prompt: `You are an expert data analyst for an e-learning platform. Your task is to identify the top 10 most engaged and highest-performing students from the provided list.

Consider the following factors for each student:
- \`rewardPoints\`: Higher is better. This is a primary indicator of engagement.
- \`coursesCompleted\`: More completed courses show dedication.
- \`testsTaken\`: A high number of tests indicates active learning.
- \`lastLogin\`: Recent activity is a positive sign.

Analyze the following student data:
{{{json students}}}

Based on your analysis, provide a ranked list of the top 10 student UIDs. The list should be ordered from the best student (rank 1) to the 10th best.
`,
});

const suggestTopStudentsFlow = ai.defineFlow(
  {
    name: 'suggestTopStudentsFlow',
    inputSchema: SuggestTopStudentsInputSchema,
    outputSchema: SuggestTopStudentsOutputSchema,
  },
  async (input) => {
    // If there are 10 or fewer students, just return them all.
    if (input.students.length <= 10) {
        const uids = input.students.map(s => s.uid);
        // Pad with empty strings if less than 10
        while(uids.length < 10) {
            uids.push("");
        }
        return { topStudentUids: uids };
    }
    
    const { output } = await prompt(input);
    return output!;
  }
);