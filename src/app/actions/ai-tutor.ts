'use server';

import {
  generateAiTutorResponse,
  type GenerateAiTutorResponseInput,
  type GenerateAiTutorResponseOutput,
} from '@/ai/flows/generate-ai-tutor-response';
import {
    generateAudio,
    type GenerateAudioOutput,
} from '@/ai/flows/generate-audio'

export async function generateAiTutorResponseAction(
  input: GenerateAiTutorResponseInput
): Promise<GenerateAiTutorResponseOutput> {
  // No try-catch block here to let errors propagate to the client component
  // where they can be handled and displayed to the user.
  const result = await generateAiTutorResponse(input);
  return result;
}

export async function getAudioAction(text: string): Promise<GenerateAudioOutput> {
    try {
        const result = await generateAudio(text);
        return result;
    } catch (error) {
        console.error('Error in getAudioAction:', error);
        throw new Error("Failed to generate audio.");
    }
}
