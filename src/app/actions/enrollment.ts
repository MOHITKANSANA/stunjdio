
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth as adminAuth } from '@/lib/firebase-admin'; // Use Admin SDK for server-side auth
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

interface EnrollmentInput {
  courseId: string;
  courseTitle: string;
  screenshotDataUrl: string;
}

async function getAuthenticatedUser() {
  const authorization = headers().get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying auth token:', error);
      return null;
    }
  }
  return null;
}


export async function submitEnrollmentAction(input: EnrollmentInput): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to enroll.' };
  }

  try {
    const { courseId, courseTitle, screenshotDataUrl } = input;

    // 1. Upload screenshot to Firebase Storage
    const storage = getStorage();
    const screenshotRef = ref(storage, `enrollments/${user.uid}_${courseId}_${Date.now()}.jpg`);
    const uploadResult = await uploadString(screenshotRef, screenshotDataUrl, 'data_url');
    const screenshotUrl = await getDownloadURL(uploadResult.ref);

    // 2. Create enrollment document in Firestore
    await addDoc(collection(firestore, 'enrollments'), {
      courseId,
      courseTitle,
      userId: user.uid,
      userEmail: user.email,
      userDisplayName: user.name || user.email, // 'name' from decoded token
      screenshotUrl,
      status: 'pending', // initial status
      createdAt: serverTimestamp(),
    });

    revalidatePath('/admin'); // To refresh the admin panel view
    revalidatePath('/dashboard/courses');

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting enrollment:', error);
    return { success: false, error: error.message || 'Failed to submit enrollment request.' };
  }
}
