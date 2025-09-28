'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Youtube } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Refactored ClassGrid into a standalone component to prevent re-creation on render.
const ClassGrid = ({ classes, loading, error, type }: { classes: any[] | undefined, loading: boolean, error: any, type: 'live' | 'recorded' }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-64 rounded-lg" />)}
            </div>
        );
    }
    
    if (error) return <p className="text-destructive text-center">Error: {error.message}</p>;
    
    if (!classes || classes.length === 0) {
        return (
            <div className="text-center py-12">
               {type === 'live' ? <Video className="mx-auto h-12 w-12 text-muted-foreground" /> : <Youtube className="mx-auto h-12 w-12 text-muted-foreground" />}
               <h3 className="mt-4 text-lg font-semibold">{type === 'live' ? 'No Upcoming Classes' : 'No Lectures Available'}</h3>
               <p className="mt-1 text-sm text-muted-foreground">{type === 'live' ? 'Please check back later for new live classes.' : 'Past live classes will appear here as video lectures.'}</p>
           </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(doc => {
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
                                {type === 'live' && (
                                     <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md animate-pulse">LIVE</div>
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
    );
};


export default function ClassesAndLecturesPage() {
    const now = new Date();
    
    const [liveClasses, liveLoading, liveError] = useCollection(
        query(collection(firestore, 'live_classes'), where('startTime', '>', now), orderBy('startTime', 'asc'))
    );
    
    const [pastClasses, pastLoading, pastError] = useCollection(
        query(collection(firestore, 'live_classes'), where('startTime', '<=', now), orderBy('startTime', 'desc'))
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Classes &amp; Lectures</h1>
                <p className="text-muted-foreground mt-2">Join our live sessions and catch up on past lectures.</p>
            </div>
            
            <Tabs defaultValue="live">
                <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                    <TabsTrigger value="live">Upcoming Live Classes</TabsTrigger>
                    <TabsTrigger value="recorded">Recorded Lectures</TabsTrigger>
                </TabsList>
                <TabsContent value="live" className="mt-6">
                    <ClassGrid classes={liveClasses?.docs} loading={liveLoading} error={liveError} type="live" />
                </TabsContent>
                <TabsContent value="recorded" className="mt-6">
                    <ClassGrid classes={pastClasses?.docs} loading={pastLoading} error={pastError} type="recorded" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
