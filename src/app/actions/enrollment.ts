
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

// NOTE: The user has insisted on saving the image data directly into Firestore.
// This is not a recommended practice as it can lead to performance issues and higher costs
// due to large document sizes. The standard practice is to use Firebase Storage for files.

interface EnrollmentInput {
  courseId: string;
  courseTitle: string;
  screenshotDataUrl: string; // This will now be saved directly to Firestore
}

export async function submitEnrollmentAction(input: EnrollmentInput): Promise<{ success: boolean; error?: string }> {
  const { courseId, courseTitle, screenshotDataUrl } from input;

  // This is a placeholder for a real auth solution.
  // In a real app, you would use a session management library or verify a token.
  // For now, we will proceed assuming a user is logged in.
  const mockUser = {
      uid: new Date().getTime().toString(), // semi-unique
      email: "student@example.com",
      name: "Student User"
  };

  if (!mockUser) {
      return { success: false, error: 'You must be logged in to enroll.' };
  }

  if (!screenshotDataUrl.startsWith('data:image/')) {
    return { success: false, error: 'Invalid image format. Please upload a valid screenshot.' };
  }


  try {
    // 1. Create enrollment document in Firestore with the screenshot data URL
    await addDoc(collection(firestore, 'enrollments'), {
      courseId,
      courseTitle,
      userId: mockUser.uid,
      userEmail: mockUser.email,
      userDisplayName: mockUser.name,
      screenshotDataUrl, // Saving the base64 data URL directly
      status: 'pending', // initial status
      createdAt: serverTimestamp(),
    });

    revalidatePath('/admin');
    revalidatePath('/dashboard/courses');

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting enrollment:', error);
    // Check for specific Firestore errors if needed
    if (error.code === 'resource-exhausted' || (error.message && error.message.includes('exceeds the maximum size'))) {
       return { success: false, error: 'The uploaded image is too large. Please use a smaller file.' };
    }
    return { success: false, error: error.message || 'Failed to submit enrollment request.' };
  }
}
