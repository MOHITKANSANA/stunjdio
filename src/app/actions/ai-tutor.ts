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
  try {
    const result = await generateAiTutorResponse(input);
    return result;
  } catch (error) {
    console.error('Error in generateAiTutorResponseAction:', error);
    // Return a structured error response that matches the expected output type
    return {
      answer: "An error occurred while generating the AI tutor response. Please try again.",
      followUpQuestions: [],
    };
  }
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
