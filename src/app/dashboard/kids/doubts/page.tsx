'use client';

import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function MyDoubtsPage() {
    const { user, loading: authLoading } = useAuth();

    // This query is complex and might require an index.
    // A simpler approach would be to store replies in a subcollection of a user document.
    // For now, we query all doubts and filter client-side.
    const [doubts, doubtsLoading, doubtsError] = useCollection(
        query(collection(firestore, 'kidsTubeDoubts'), orderBy('createdAt', 'desc'))
    );

    const myDoubtsWithReplies = doubts?.docs.filter(doc => {
        const data = doc.data();
        // Check if the user is the author of the doubt OR if the user is the author of any reply
        const hasMyReply = data.replies?.some((reply: any) => reply.userId === user?.uid);
        const isMyDoubt = data.userId === user?.uid;
        // We are most interested in when OTHERS reply to my doubts.
        const hasRepliesFromOthers = data.replies?.some((reply: any) => reply.userId !== user?.uid);
        
        return isMyDoubt && hasRepliesFromOthers;
    });

    if (authLoading || doubtsLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        )
    }

    if (doubtsError) {
        return <p className="text-destructive">Error loading your doubts.</p>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <HelpCircle className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-bold mt-4">My Doubts</h1>
                <p className="text-muted-foreground mt-2">Here are the doubts you've asked that received replies.</p>
            </div>

            {myDoubtsWithReplies && myDoubtsWithReplies.length > 0 ? (
                <div className="space-y-4">
                    {myDoubtsWithReplies.map(doc => {
                        const doubt = doc.data();
                        return (
                            <Card key={doc.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg line-clamp-2">{doubt.text}</CardTitle>
                                    <CardDescription>
                                        You asked this on a video. <Link href={`/dashboard/kids/video/${doubt.videoId}`} className="text-primary hover:underline">View Doubt</Link>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{doubt.replies.length} replies received.</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">You have no doubts with new replies.</p>
                </div>
            )}
        </div>
    )
}
