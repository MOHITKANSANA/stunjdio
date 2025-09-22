'use server';

import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';

// Points configuration
const POINTS = {
  WATCH: 5,
  LIKE: 5,
  DISLIKE: 5,
  FOLLOW: 10,
};

// Helper function to update user points
const updateUserPoints = async (userId: string, points: number) => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    rewardPoints: increment(points),
  });
};

export async function handleFollowAction(userId: string) {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && !userSnap.data().hasFollowed) {
      await updateDoc(userRef, { hasFollowed: true });
      await updateUserPoints(userId, POINTS.FOLLOW);
      return { success: true, message: `+${POINTS.FOLLOW} points for following!` };
    }
    return { success: false, message: 'Already followed or user not found.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleLikeDislikeAction(
  videoId: string,
  userId: string,
  action: 'like' | 'dislike'
) {
  try {
    const videoRef = doc(firestore, 'kidsTubeVideos', videoId);
    const userRef = doc(firestore, 'users', userId);

    const userInteractionsRef = collection(firestore, 'userInteractions');
    const q = query(userInteractionsRef, where('userId', '==', userId), where('videoId', '==', videoId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // User has interacted before, can't get more points
        return { success: true, message: 'Interaction updated.' };
    }
    
    // First time interaction, give points
    await addDoc(userInteractionsRef, { userId, videoId, interactedAt: serverTimestamp() });
    
    if (action === 'like') {
      await updateDoc(videoRef, {
        likes: increment(1),
      });
      await updateUserPoints(userId, POINTS.LIKE);
      return { success: true, points: POINTS.LIKE };
    } else {
      await updateDoc(videoRef, {
        dislikes: increment(1),
      });
       await updateUserPoints(userId, POINTS.DISLIKE);
       return { success: true, points: POINTS.DISLIKE };
    }

  } catch (error: any) {
    console.error('Error in handleLikeDislikeAction:', error);
    return { success: false, error: error.message };
  }
}

export async function addDoubtAction(videoId: string, userId: string, userName: string, userPhoto: string | null, text: string) {
    try {
        const doubtData = {
            videoId,
            userId,
            userName,
            userPhoto,
            text,
            createdAt: serverTimestamp(),
            likes: 0,
            dislikes: 0,
            replies: [],
        };
        await addDoc(collection(firestore, 'kidsTubeDoubts'), doubtData);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addReplyAction(doubtId: string, userId: string, userName: string, userPhoto: string | null, text: string) {
    try {
        const doubtRef = doc(firestore, 'kidsTubeDoubts', doubtId);
        const replyData = {
            id: doc(collection(firestore, 'dummy')).id, // generate a unique id
            userId,
            userName,
            userPhoto,
            text,
            createdAt: new Date(),
        };
        await updateDoc(doubtRef, {
            replies: arrayUnion(replyData)
        });
        return { success: true };
    } catch(error: any) {
        return { success: false, error: error.message };
    }
}

export async function redeemRewardsAction(userId: string, userName: string, userEmail: string, paytmNumber: string) {
    try {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || (userSnap.data().rewardPoints || 0) < 1000) {
            return { success: false, error: "Not enough points to redeem." };
        }

        await updateDoc(userRef, {
            rewardPoints: increment(-1000)
        });

        await addDoc(collection(firestore, 'rewardRedemptions'), {
            userId,
            userName,
            userEmail,
            paytmNumber,
            points: 1000,
            amount: 10,
            redeemedAt: serverTimestamp()
        });

        return { success: true, message: "Redemption successful! Payment will be processed soon." };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addVideoWatchPointAction(userId: string) {
    try {
        await updateUserPoints(userId, POINTS.WATCH);
        return { success: true, points: POINTS.WATCH };
    } catch(error: any) {
        return { success: false, error: error.message };
    }
}
