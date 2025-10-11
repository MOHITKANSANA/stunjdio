
'use server';

import { admin, firestore as adminFirestore } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

export async function sendNotificationsAction(
  title: string,
  message: string
): Promise<{ success: boolean; successCount?: number; error?: string }> {
  try {
    // lib/firebase-admin now handles initialization, so this check is simpler.
    if (!admin.apps.length) {
        throw new Error("Firebase Admin SDK is not initialized correctly.");
    }
    
    // Use adminFirestore for querying user data on the server
    const usersSnapshot = await adminFirestore.collection('users').get();
    const allTokens: string[] = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        // Add all tokens from the array
        allTokens.push(...userData.fcmTokens);
      }
    });

    if (allTokens.length === 0) {
      return { success: true, successCount: 0, error: "No registered devices found to send notifications." };
    }

    // Ensure we only send to unique tokens to avoid duplicate messages and errors
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
                // Log the error and the token that failed.
                console.error(`Failed to send to token ${uniqueTokens[idx]}:`, resp.error);
                failedTokens.push(uniqueTokens[idx]);
            }
        });
        console.error('List of tokens that caused failures: ' + failedTokens);
        // We still count it as a partial success if some notifications were sent.
        return { success: true, successCount: response.successCount, error: `${response.failureCount} notifications failed to send.`};
    }

    return { success: true, successCount: response.successCount };
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return { success: false, error: error.message || 'An unknown server error occurred.' };
  }
}
