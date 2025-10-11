
'use server';

import * as admin from 'firebase-admin';
import { getDocs, collection } from 'firebase/firestore';
import { firestore as clientFirestore } from '@/lib/firebase';
import { auth as adminAuth } from '@/lib/firebase-admin'; // Import initialized admin

export async function sendNotificationsAction(
  title: string,
  message: string
): Promise<{ success: boolean; successCount?: number; error?: string }> {
  try {
    if (admin.apps.length === 0) {
        throw new Error("Firebase Admin SDK not initialized.");
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

    const messagePayload: admin.messaging.MulticastMessage = {
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
    
    const response = await admin.messaging().sendEachForMulticast(messagePayload);

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
