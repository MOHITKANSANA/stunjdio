
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Youtube } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function VideoLecturesPage() {
    const now = new Date();
    // Fetch classes that have already started
    const [pastClasses, loading, error] = useCollection(
        query(collection(firestore, 'live_classes'), where('startTime', '<=', now), orderBy('startTime', 'desc'))
    );

    if (loading) {
        return (
             <div className="space-y-8 p-4 md:p-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">Video Lectures</h1>
                    <p className="text-muted-foreground mt-2">Catch up on past live classes and lectures.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-64 rounded-lg" />)}
                </div>
            </div>
        );
    }
    
    if (error) return <p className="text-destructive text-center p-8">Error: {error.message}</p>;
    
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Video Lectures</h1>
                <p className="text-muted-foreground mt-2">Catch up on past live classes and lectures.</p>
            </div>
            
            {pastClasses && pastClasses.docs.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastClasses.docs.map(doc => {
                        const liveClass = doc.data();
                        const startTime = liveClass.startTime?.toDate();
                        return (
                            <Link href={`/dashboard/live-class/${doc.id}`} key={doc.id}>
                                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group">
                                    <div className="relative w-full aspect-video bg-muted">
                                        <Image 
                                            src={liveClass.thumbnailUrl || `https://picsum.photos/seed/live-${doc.id}/400/225`}
                                            alt={liveClass.title}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            className="group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2">{liveClass.title}</CardTitle>
                                        {startTime && <CardDescription>{startTime.toLocaleString()}</CardDescription>}
                                    </CardHeader>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                   <Youtube className="mx-auto h-12 w-12 text-muted-foreground" />
                   <h3 className="mt-4 text-lg font-semibold">No Lectures Available</h3>
                   <p className="mt-1 text-sm text-muted-foreground">Past live classes will appear here as video lectures.</p>
               </div>
            )}
        </div>
    );
}
