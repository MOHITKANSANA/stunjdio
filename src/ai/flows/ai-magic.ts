
'use server';
/**
 * @fileOverview An all-in-one AI assistant that can answer questions and generate images.
 *
 * - performAiMagic - The main function that processes the user's prompt.
 * - AiMagicInput - The input type for the function.
 * - AiMagicOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const AiMagicInputSchema = z.object({
  prompt: z.string().describe('The user\'s request, which could be a question or an image generation prompt.'),
  imageDataUri: z.string().optional().describe(
    "An optional image provided by the user to ask questions about, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type AiMagicInput = z.infer<typeof AiMagicInputSchema>;

const AiMagicOutputSchema = z.object({
  answer: z.string().describe("The AI's text-based answer to the user's prompt."),
  generatedImageDataUri: z.string().optional().describe("A generated image as a data URI, if the user requested one. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type AiMagicOutput = z.infer<typeof AiMagicOutputSchema>;

export async function performAiMagic(input: AiMagicInput): Promise<AiMagicOutput> {
  return aiMagicFlow(input);
}

const aiMagicFlow = ai.defineFlow(
  {
    name: 'aiMagicFlow',
    inputSchema: AiMagicInputSchema,
    outputSchema: AiMagicOutputSchema,
  },
  async (input) => {
    // Step 1: Determine user's intent - question answering or image generation.
    const intentPrompt = ai.definePrompt({
      name: 'intentDetectionPrompt',
      prompt: `Analyze the user's prompt to determine their primary intent. Respond with "image_generation" if they are asking to create, draw, or generate an image. Otherwise, respond with "question_answering".

User Prompt: "${input.prompt}"
User Intent:`,
      config: { temperature: 0 },
    });
    
    const intentResponse = await intentPrompt();
    const intent = intentResponse.text.trim().toLowerCase();

    let answer = '';
    let generatedImageDataUri: string | undefined = undefined;

    if (intent === 'image_generation') {
      // Step 2a: Image Generation
      answer = "Here is the image you requested. I hope you like it!";
      const { media } = await ai.generate({
        model: googleAI.model('imagen-4.0-fast-generate-001'),
        prompt: input.prompt,
      });
      generatedImageDataUri = media.url;

    } else {
      // Step 2b: Question Answering
      const qaPrompt = ai.definePrompt({
        name: 'qaPrompt',
        prompt: `You are a helpful AI assistant. Provide a clear and concise answer to the user's question. Use the provided image as context if available.
        
User Question: {{{prompt}}}
{{#if imageDataUri}}
[Image Provided by User]
{{media url=imageDataUri}}
{{/if}}`
      });

      const qaResponse = await qaPrompt({ prompt: input.prompt, imageDataUri: input.imageDataUri });
      answer = qaResponse.text;
    }
    
    return {
      answer,
      generatedImageDataUri,
    };
  }
);
