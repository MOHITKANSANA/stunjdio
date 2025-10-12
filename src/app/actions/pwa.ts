'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export async function trackPwaInstallAction(userId: string): Promise<{ success: boolean }> {
  if (!userId) {
    return { success: false };
  }
  
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      pwaInstalled: true,
      pwaInstalledAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error tracking PWA install:', error);
    return { success: false };
  }
}
