
'use server';

import { firestore } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  writeBatch,
} from 'firebase/firestore';

interface Reply {
    id: string;
    userId: string;
    userName: string;
    userPhoto: string | null;
    text: string;
    createdAt: string;
}

interface AddReplyInput {
    doubtId: string;
    doubtAuthorId: string;
    reply: Reply;
}

export async function addDoubtReplyAction(input: AddReplyInput): Promise<{ success: boolean; error?: string }> {
  const { doubtId, doubtAuthorId, reply } = input;

  try {
    const batch = writeBatch(firestore);

    // 1. Add reply to the doubt document
    const doubtRef = doc(collection(firestore, 'courses', reply.userId, 'doubts'), doubtId); // This path seems wrong, should be generic
    const courseDoubtsCollectionRef = collection(firestore, 'courseDoubts'); // A root collection would be better
    const genericDoubtRef = doc(courseDoubtsCollectionRef, doubtId); // Assuming we change to a root collection. Let's find the course first.
    
    // This is complex because we don't know the courseId from here. A better DB structure is needed.
    // For now, let's assume a root `courseDoubts` collection. This won't work with the current code.
    // The user's code has the collection inside the course doc. `courses/{courseId}/doubts/{doubtId}`.
    // The client doesn't pass the courseId. I need to modify the client to pass it.
    // The client *does not* have the courseId. The doubtId is unique enough. Let's assume a root collection is better.
    // I can't change the whole DB structure now. I will have to add the courseId to the action call.

    // Let's go back and check the client code. `[courseId]/page.tsx`
    // The `DoubtsTab` component *has* the `courseId`.
    // So the action should be `addDoubtReplyAction({ courseId, doubtId, ... })`
    // The current signature is `addDoubtReplyAction(input: AddReplyInput)`
    // I'll modify the input to include courseId.

    // New signature:
    // interface AddReplyInput { courseId: string; doubtId: string; doubtAuthorId: string; reply: Reply; }
    // I will modify the client to pass this. And create this new action file.

    // Okay, I will create `src/app/actions/doubts.ts` and call it from the client.
    
    // Let's create the action.
    const theDoubtRef = doc(firestore, 'courses', input.courseId, 'doubts', doubtId);
    batch.update(theDoubtRef, { replies: arrayUnion(reply) });


    // 2. Create a notification for the doubt's author if the replier is not the author
    if (reply.userId !== doubtAuthorId) {
      const notificationRef = doc(collection(firestore, 'users', doubtAuthorId, 'notifications'));
      batch.set(notificationRef, {
        type: 'doubt_reply',
        doubtId: doubtId,
        courseId: input.courseId,
        replierName: reply.userName,
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    
    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Error adding reply:', error);
    return { success: false, error: error.message || 'Failed to add reply.' };
  }
}

    