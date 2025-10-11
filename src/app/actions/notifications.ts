
'use server';

import { admin, firestore as adminFirestore } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

export async function sendNotificationsAction(
  title: string,
  message: string
): Promise<{ success: boolean; successCount?: number; error?: string }> {
  try {
    if (!admin.apps.length) {
        throw new Error("Firebase Admin SDK not initialized correctly.");
    }
    
    // Use adminFirestore for querying user data on the server
    const usersSnapshot = await adminFirestore.collection('users').get();
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
                console.error(`Failed to send to token ${uniqueTokens[idx]}:`, resp.error);
            }
        });
        console.error('List of tokens that caused failures: ' + failedTokens);
    }

    return { success: true, successCount: response.successCount };
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    // The error object might be complex, so we stringify it to see the details.
    return { success: false, error: error.message || JSON.stringify(error) };
  }
}
