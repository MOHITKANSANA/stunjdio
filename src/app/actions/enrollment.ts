
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

interface EnrollmentInput {
  courseId: string;
  courseTitle: string;
  screenshotDataUrl: string;
}

export async function submitEnrollmentAction(input: EnrollmentInput): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;

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
      userDisplayName: user.displayName,
      screenshotUrl,
      status: 'pending', // initial status
      createdAt: serverTimestamp(),
    });

    revalidatePath('/admin'); // To refresh the admin panel view

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting enrollment:', error);
    return { success: false, error: error.message || 'Failed to submit enrollment request.' };
  }
}
