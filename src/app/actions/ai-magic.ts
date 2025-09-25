
'use server';

import {
  performAiMagic,
  type AiMagicInput,
  type AiMagicOutput,
} from '@/ai/flows/ai-magic';

export async function performAiMagicAction(
  input: AiMagicInput
): Promise<AiMagicOutput> {
  try {
    const result = await performAiMagic(input);
    return result;
  } catch (error: any) {
    console.error('Error in performAiMagicAction:', error);
    throw new Error(error.message || "Failed to perform AI magic. Please try again.");
  }
}
