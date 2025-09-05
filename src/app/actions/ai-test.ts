'use server';

import {
  generateAiTest,
  type GenerateAiTestInput,
  type GenerateAiTestOutput,
} from '@/ai/flows/generate-ai-test';

export async function generateAiTestAction(
  input: GenerateAiTestInput
): Promise<GenerateAiTestOutput> {
  try {
    const result = await generateAiTest(input);
    return result;
  } catch (error: any) {
    console.error('Error in generateAiTestAction:', error);
    // Propagate a user-friendly error message
    throw new Error(error.message || "Failed to generate the test. Please try again.");
  }
}
