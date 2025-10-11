
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { getMessaging } from 'firebase-admin/messaging';
import { auth as adminAuth, firestore as adminFirestore } from '@/lib/firebase-admin';


interface EnrollmentInput {
  enrollmentType: string;
  courseId: string | null;
  courseTitle: string;
  screenshotDataUrl: string;
}

async function sendNotificationToAdmin(title: string, body: string) {
    const adminToken = process.env.ADMIN_FCM_TOKEN;

    if (!adminToken) {
        console.warn("ADMIN_FCM_TOKEN is not set. Cannot send enrollment notification.");
        return;
    }

    try {
         // Ensure admin app is initialized
        if (!adminAuth) {
            throw new Error("Firebase Admin SDK not initialized correctly for notifications.");
        }

        const message = {
            notification: {
                title,
                body,
            },
            token: adminToken,
        };
        
        await getMessaging().send(message);
        console.log('Successfully sent enrollment notification to admin.');
    } catch (error) {
        console.error('Error sending enrollment notification to admin:', error);
    }
}


export async function submitEnrollmentAction(input: EnrollmentInput, user: { uid: string, email: string | null, displayName: string | null }): Promise<{ success: boolean; error?: string }> {
  const { enrollmentType, courseId, courseTitle, screenshotDataUrl } = input;

  if (!user) {
      return { success: false, error: 'You must be logged in to enroll.' };
  }

  if (!screenshotDataUrl.startsWith('data:image/')) {
    return { success: false, error: 'Invalid image format. Please upload a valid screenshot.' };
  }


  try {
    await addDoc(collection(firestore, 'enrollments'), {
      enrollmentType,
      courseId,
      courseTitle,
      userId: user.uid,
      userEmail: user.email,
      userDisplayName: user.displayName,
      screenshotDataUrl, 
      status: 'pending', // initial status
      createdAt: serverTimestamp(),
    });

    // Send notification to admin
    await sendNotificationToAdmin(
        'New Enrollment Request',
        `${courseTitle} by ${user.displayName || 'a new user'}`
    );

    revalidatePath('/admin');
    revalidatePath('/dashboard/courses');

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting enrollment:', error);
    return { success: false, error: error.message || 'Failed to submit enrollment request.' };
  }
}
