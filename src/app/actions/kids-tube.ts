
'use server';

import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  addDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

// Points configuration
const POINTS = {
  WATCH: 5,
  LIKE: 5,
  UNLIKE: -5,
  DISLIKE: 5, // Kept for potential future use
  UNDISLIKE: -5,
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
      
      const channelRef = doc(firestore, 'channels', 'gsc');
      await updateDoc(channelRef, { followers: increment(1) });

      return { success: true, message: `+${POINTS.FOLLOW} points for following!` };
    }
    return { success: false, message: 'Already followed or user not found.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleLikeToggleAction(
  videoId: string,
  userId: string
) {
    const videoRef = doc(firestore, 'kidsTubeVideos', videoId);
    const userInteractionRef = doc(firestore, 'userVideoInteractions', `${userId}_${videoId}`);

    try {
        return await runTransaction(firestore, async (transaction) => {
            const interactionDoc = await transaction.get(userInteractionRef);
            
            if (interactionDoc.exists()) {
                // User has already interacted, so we toggle the like state
                const currentAction = interactionDoc.data().action;
                if (currentAction === 'like') {
                    // It was liked, now it's unliked
                    transaction.update(videoRef, { likes: increment(-1) });
                    transaction.delete(userInteractionRef);
                    await updateUserPoints(userId, POINTS.UNLIKE);
                    return { success: true, points: POINTS.UNLIKE, newState: 'none' };
                } else {
                    // This case handles if we re-introduce dislikes. For now, it's just 'like' or nothing.
                    // To be safe, let's treat any other existing state as a new 'like'.
                    transaction.update(videoRef, { likes: increment(1) });
                    transaction.set(userInteractionRef, { userId, videoId, action: 'like', interactedAt: serverTimestamp() }, { merge: true });
                    await updateUserPoints(userId, POINTS.LIKE);
                    return { success: true, points: POINTS.LIKE, newState: 'liked' };
                }
            } else {
                // First time liking this video
                transaction.update(videoRef, { likes: increment(1) });
                transaction.set(userInteractionRef, { userId, videoId, action: 'like', interactedAt: serverTimestamp() });
                await updateUserPoints(userId, POINTS.LIKE);
                return { success: true, points: POINTS.LIKE, newState: 'liked' };
            }
        });
    } catch (error: any) {
        console.error('Error in handleLikeToggleAction:', error);
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
            status: 'pending',
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

export async function requestExtraPointsAction(userId: string, userName: string, userEmail: string) {
    try {
        await addDoc(collection(firestore, 'pointRequests'), {
            userId,
            userName,
            userEmail,
            status: 'pending',
            requestedAt: serverTimestamp()
        });
        return { success: true, message: "Your request for extra points has been sent to the admin." };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function awardExtraPointsAction(requestId: string, userId: string, points: number) {
    if (points <= 0) {
        return { success: false, error: "Points must be a positive number." };
    }
    try {
        await updateUserPoints(userId, points);
        
        const requestRef = doc(firestore, 'pointRequests', requestId);
        await updateDoc(requestRef, {
            status: 'awarded',
            pointsAwarded: points,
            awardedAt: serverTimestamp()
        });
        return { success: true, message: `${points} points awarded successfully.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
