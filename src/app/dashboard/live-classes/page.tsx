'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clapperboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function LiveClassesPage() {
    
    const [liveClasses, loading, error] = useCollection(
        query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc'))
    );

    const now = new Date();

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Live Classes & Lectures</h1>
                <p className="text-muted-foreground mt-2">Join our live sessions and catch up on past lectures.</p>
            </div>

            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="w-full h-64 rounded-lg" />)}
                </div>
            )}
            
            {error && <p className="text-destructive text-center">Error: {error.message}</p>}
            
            {!loading && (!liveClasses || liveClasses.empty) && (
                <div className="text-center py-12">
                   <Clapperboard className="mx-auto h-12 w-12 text-muted-foreground" />
                   <h3 className="mt-4 text-lg font-semibold">No Classes Available</h3>
                   <p className="mt-1 text-sm text-muted-foreground">Please check back later for new live classes and recorded lectures.</p>
               </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveClasses?.docs.map(doc => {
                    const liveClass = doc.data();
                    const startTime = liveClass.startTime?.toDate();
                    const isLive = startTime && startTime > now;
                    const isPast = startTime && startTime <= now;

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
                                    {isLive && (
                                         <Badge variant="destructive" className="absolute top-2 left-2 animate-pulse">LIVE</Badge>
                                    )}
                                     {isPast && (
                                         <Badge variant="secondary" className="absolute top-2 left-2">RECORDED</Badge>
                                    )}
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
        </div>
    );
}
