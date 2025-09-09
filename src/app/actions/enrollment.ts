
'use server';

import { firestore } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

interface EnrollmentInput {
  enrollmentType: string;
  courseId: string | null;
  courseTitle: string;
  screenshotDataUrl: string;
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
    // 1. Upload screenshot to Firebase Storage
    const storage = getStorage();
    const screenshotRef = ref(storage, `enrollment_screenshots/${user.uid}_${courseId}_${Date.now()}`);
    const uploadResult = await uploadString(screenshotRef, screenshotDataUrl, 'data_url');
    const screenshotUrl = await getDownloadURL(uploadResult.ref);

    // 2. Create enrollment document in Firestore with the screenshot URL
    await addDoc(collection(firestore, 'enrollments'), {
      enrollmentType,
      courseId,
      courseTitle,
      userId: user.uid,
      userEmail: user.email,
      userDisplayName: user.displayName,
      screenshotUrl, 
      status: 'pending', // initial status
      createdAt: serverTimestamp(),
    });

    revalidatePath('/admin');
    revalidatePath('/dashboard/courses');

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting enrollment:', error);
    return { success: false, error: error.message || 'Failed to submit enrollment request.' };
  }
}
