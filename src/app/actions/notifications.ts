
'use server';

import { auth as adminAuth, firestore as adminFirestore } from '@/lib/firebase-admin'; // Ensure this is the admin instance
import { getDocs, collection } from 'firebase/firestore';
import { firestore as clientFirestore } from '@/lib/firebase';
import { getMessaging } from 'firebase-admin/messaging';


export async function sendNotificationsAction(
  title: string,
  message: string
): Promise<{ success: boolean; successCount?: number; error?: string }> {
  try {
    // This check might be redundant if firebase-admin is initialized correctly, but it's a good safeguard.
    if (!adminAuth) {
        throw new Error("Firebase Admin SDK not initialized correctly.");
    }
    
    const usersSnapshot = await getDocs(collection(clientFirestore, 'users'));
    const allTokens: string[] = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        allTokens.push(...userData.fcmTokens);
      }
    });

    if (allTokens.length === 0) {
      return { success: true, successCount: 0, error: "No registered devices found to send notifications." };
    }

    const uniqueTokens = [...new Set(allTokens)];

    const messagePayload = {
      notification: {
        title,
        body: message,
      },
      webpush: {
          notification: {
              icon: '/go-swami-logo.png',
              badge: '/go-swami-logo.png'
          }
      },
      tokens: uniqueTokens,
    };
    
    // Use getMessaging() from firebase-admin/messaging
    const response = await getMessaging().sendEachForMulticast(messagePayload);

    if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(uniqueTokens[idx]);
            }
        });
        console.error('List of tokens that caused failures: ' + failedTokens);
    }

    return { success: true, successCount: response.successCount };
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return { success: false, error: error.message || 'Failed to send notifications.' };
  }
}
