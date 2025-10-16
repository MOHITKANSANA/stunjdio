
'use server';
/**
 * @fileOverview Provides AI Tutor responses including an answer and follow-up questions.
 *
 * - generateAiTutorResponse - A function that generates a response for the AI Tutor.
 * - GenerateAiTutorResponseInput - The input type for the function.
 * - GenerateAiTutorResponseOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAiTutorResponseInputSchema = z.object({
  question: z.string().describe('The question asked by the user.'),
  language: z.string().describe('The language in which the response should be generated (e.g., English, Hindi, Kannada).'),
  imageDataUri: z.string().optional().describe(
    "An optional image provided by the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type GenerateAiTutorResponseInput = z.infer<typeof GenerateAiTutorResponseInputSchema>;

const GenerateAiTutorResponseOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question, in the requested language. This should be a clear, concise, and helpful response."),
  followUpQuestions: z.array(z.string()).length(3).describe('An array of exactly three relevant follow-up questions to encourage further learning.'),
});
export type GenerateAiTutorResponseOutput = z.infer<typeof GenerateAiTutorResponseOutputSchema>;

export async function generateAiTutorResponse(
  input: GenerateAiTutorResponseInput
): Promise<GenerateAiTutorResponseOutput> {
  return generateAiTutorResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiTutorResponsePrompt',
  input: { schema: GenerateAiTutorResponseInputSchema },
  output: { schema: GenerateAiTutorResponseOutputSchema },
  prompt: `You are an expert AI Tutor. Your role is to provide a clear, concise, and helpful answer to the user's question. If the user only provides an image, describe the image or answer the implied question. If there is text and an image, use both to provide the best answer. After answering, you must also provide exactly three relevant follow-up questions to help the user test their understanding and explore the topic further.

Generate the response, including the answer and follow-up questions, in the following language: {{{language}}}.

User's Question: {{{question}}}
{{#if imageDataUri}}
[Image Provided by User]
{{media url=imageDataUri}}
{{/if}}`,
});


const generateAiTutorResponseFlow = ai.defineFlow(
  {
    name: 'generateAiTutorResponseFlow',
    inputSchema: GenerateAiTutorResponseInputSchema,
    outputSchema: GenerateAiTutorResponseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a response. Please try again with a different query.");
    }
    return output;
  }
);
