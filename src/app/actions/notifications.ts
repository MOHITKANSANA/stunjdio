
'use server';

import * as admin from 'firebase-admin';
import { getDocs, collection } from 'firebase/firestore';
import { firestore as clientFirestore } from '@/lib/firebase';
try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
} catch (e) {
    console.error('Firebase Admin Initialization Error in notifications action:', e);
}


export async function sendNotificationsAction(
  title: string,
  message: string
): Promise<{ success: boolean; successCount?: number; error?: string }> {
  try {
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

    return { success: true, successCount: response.successCount };
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return { success: false, error: error.message || 'Failed to send notifications.' };
  }
}
