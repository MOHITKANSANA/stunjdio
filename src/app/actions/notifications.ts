
'use server';

import { admin, messaging } from '@/lib/firebase-admin';

export async function sendNotificationsAction(
  title: string,
  message: string
): Promise<{ success: boolean; successCount?: number; error?: string }> {
  try {
    if (!admin.apps.length) {
        console.error("Firebase Admin SDK is not initialized correctly.");
        // Attempt to re-initialize or handle the error gracefully.
        // For now, we'll throw an error that the client can catch.
        throw new Error("Firebase Admin SDK is not initialized on the server.");
    }
    
    // Use admin firestore instance
    const usersSnapshot = await admin.firestore().collection('users').get();
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
    
    const response = await messaging.sendEachForMulticast(messagePayload);

    if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`Failed to send to token ${uniqueTokens[idx]}:`, resp.error);
                failedTokens.push(uniqueTokens[idx]);
            }
        });
        console.error('List of tokens that caused failures: ' + failedTokens.join(', '));
        return { success: true, successCount: response.successCount, error: `${response.failureCount} notifications failed to send.`};
    }

    return { success: true, successCount: response.successCount };
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return { success: false, error: error.message || 'An unknown server error occurred.' };
  }
}
