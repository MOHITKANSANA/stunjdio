
'use server';

import { firestore } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  writeBatch,
  DocumentReference,
  runTransaction,
  setDoc,
  query,
  where,
  getDocs
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
    courseId: string;
    doubtId: string;
    doubtAuthorId: string;
    reply: Reply;
}

export async function addDoubtReplyAction(input: AddReplyInput): Promise<{ success: boolean; error?: string }> {
  const { courseId, doubtId, doubtAuthorId, reply } = input;

  try {
    const doubtRef = doc(firestore, 'courses', courseId, 'doubts', doubtId);
    
    await runTransaction(firestore, async (transaction) => {
        const doubtDoc = await transaction.get(doubtRef);
        if (!doubtDoc.exists()) {
            throw new Error("Doubt does not exist!");
        }

        // 1. Add reply to the doubt document
        transaction.update(doubtRef, { replies: arrayUnion(reply) });
    
        // 2. Create a notification for the doubt's author if the replier is not the author
        if (reply.userId !== doubtAuthorId) {
          const notificationRef = doc(collection(firestore, 'users', doubtAuthorId, 'notifications'));
          transaction.set(notificationRef, {
            type: 'doubt_reply',
            doubtId: doubtId,
            courseId: courseId, // Pass courseId to link back
            doubtText: doubtDoc.data().text.substring(0, 50) + '...', // Add context
            replierName: reply.userName,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error adding reply:', error);
    return { success: false, error: error.message || 'Failed to add reply.' };
  }
}


export async function saveNoteAction(classId: string, userId: string, content: string): Promise<{ success: boolean, error?: string }> {
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }
    try {
        const notesQuery = query(
            collection(firestore, 'liveClassNotes'),
            where('classId', '==', classId),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(notesQuery);

        if (querySnapshot.empty) {
            // No existing note, create new
            const newNoteRef = doc(collection(firestore, 'liveClassNotes'));
            await setDoc(newNoteRef, {
                classId,
                userId,
                content,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        } else {
            // Existing note found, update it
            const noteDocRef = querySnapshot.docs[0].ref;
            await setDoc(noteDocRef, {
                content,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }
        
        return { success: true };
    } catch (error: any) {
        console.error('Error saving note:', error);
        return { success: false, error: error.message || 'Failed to save note.' };
    }
}
