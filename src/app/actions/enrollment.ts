
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, increment, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { getMessaging } from 'firebase-admin/messaging';
import { admin } from '@/lib/firebase-admin';

interface EnrollmentInput {
  enrollmentType: string;
  courseId: string | null;
  courseTitle: string;
  screenshotDataUrl: string;
  couponCode?: string | null;
  referralCode?: string | null;
  finalPrice: number;
  userId: string;
  userEmail: string | null;
  userDisplayName: string | null;
}

async function sendNotificationToAdmin(title: string, body: string) {
    const adminToken = process.env.ADMIN_FCM_TOKEN;

    if (!adminToken) {
        console.warn("ADMIN_FCM_TOKEN is not set. Cannot send enrollment notification.");
        return;
    }

    try {
        if (!admin.apps.length) {
            console.error("Firebase Admin SDK not initialized correctly for notifications.");
            return;
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

async function applyReferralReward(referralCode: string, referringUserUid: string) {
    const batch = writeBatch(firestore);

    // 1. Award 10 points to the referring user
    const referringUserRef = doc(firestore, 'users', referringUserUid);
    batch.update(referringUserRef, { rewardPoints: increment(10) });

    // 2. Log the referral transaction for tracking
    const referralLogRef = doc(collection(firestore, 'referralLogs'));
    batch.set(referralLogRef, {
        referralCode: referralCode,
        referringUserUid: referringUserUid,
        pointsAwarded: 10,
        awardedAt: serverTimestamp()
    });

    await batch.commit();
}


export async function submitEnrollmentAction(input: EnrollmentInput): Promise<{ success: boolean; error?: string }> {
  const { enrollmentType, courseId, courseTitle, screenshotDataUrl, couponCode, referralCode, finalPrice, userId, userEmail, userDisplayName } = input;

  if (!userId) {
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
      userId: userId,
      userEmail: userEmail,
      userDisplayName: userDisplayName,
      screenshotDataUrl, 
      couponCode,
      referralCode,
      finalPrice,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    if (referralCode) {
        const referralUserQuery = query(collection(firestore, 'users'), where('referralCode', '==', referralCode.toUpperCase()));
        const referralUserSnapshot = await getDocs(referralUserQuery);
        if (!referralUserSnapshot.empty) {
            const referringUser = referralUserSnapshot.docs[0];
            // Do not award points if the user is referring themselves
            if (referringUser.id !== userId) {
              await applyReferralReward(referralCode, referringUser.id);
            }
        }
    }

    await sendNotificationToAdmin(
        'New Enrollment Request',
        `${courseTitle} by ${userDisplayName || 'a new user'}`
    );

    revalidatePath('/admin');
    revalidatePath('/dashboard/courses');
    revalidatePath('/dashboard/my-learning');

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting enrollment:', error);
    return { success: false, error: error.message || 'Failed to submit enrollment request.' };
  }
}
