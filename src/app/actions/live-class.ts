

'use server';

import { firestore } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';

export async function addChatMessageAction(classId: string, userId: string, userName: string, userPhoto: string | null, text: string) {
    try {
        const chatData = {
            classId,
            userId,
            userName,
            userPhoto,
            text,
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(firestore, 'liveClassChats'), chatData);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveNoteAction(classId: string, userId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
        const noteRef = collection(firestore, 'liveClassNotes');
        // A simple way to do upsert without transactions for this use case
        const q = query(
            noteRef,
            where('classId', '==', classId),
            where('userId', '==', userId),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(noteRef, {
                classId,
                userId,
                content,
                updatedAt: serverTimestamp(),
            });
        } else {
            await querySnapshot.docs[0].ref.update({
                content,
                updatedAt: serverTimestamp(),
            });
        }
        return { success: true };
    } catch (error: any) {
        console.error("Error saving note: ", error);
        return { success: false, error: error.message || 'Failed to save note.' };
    }
}
