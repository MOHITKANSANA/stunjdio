
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const YouTubePlayer = ({ videoId }: { videoId: string }) => {
    return (
        <div className="aspect-video">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
            ></iframe>
        </div>
    );
};

const Countdown = ({ targetDate }: { targetDate: Date }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = +targetDate - +new Date();
        let timeLeft: any = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    }, [calculateTimeLeft, timeLeft]);

    if (!Object.keys(timeLeft).length) {
        return <Badge>Starting soon...</Badge>;
    }

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Starts in:</span>
            {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
            {timeLeft.hours > 0 && <span>{timeLeft.hours}h</span>}
            {timeLeft.minutes > 0 && <span>{timeLeft.minutes}m</span>}
            <span>{timeLeft.seconds}s</span>
        </div>
    );
};


export default function LiveClassPage() {
    const [liveClasses, loading, error] = useCollection(
        query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc'))
    );

    const getYoutubeVideoId = (url: string) => {
        if(!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    const now = new Date();

    const currentLiveClass = liveClasses?.docs.find(doc => {
        const startTime = doc.data().startTime?.toDate();
        return startTime && startTime <= now;
    });

    const upcomingClasses = liveClasses?.docs.filter(doc => {
        const startTime = doc.data().startTime?.toDate();
        return startTime && startTime > now;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Live Classes</h1>
                <p className="text-muted-foreground mt-2">Join our live sessions and learn from experts in real-time.</p>
            </div>

            {loading && <Skeleton className="w-full h-96" />}
            
            {error && <p className="text-destructive">Error: {error.message}</p>}

            {currentLiveClass && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                            <Badge variant="destructive" className="animate-pulse mb-2">LIVE NOW</Badge>
                             <CardTitle>{currentLiveClass.data().title}</CardTitle>
                             <CardDescription>Join the session below</CardDescription>
                           </div>
                           <Video className="h-8 w-8 text-destructive" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {getYoutubeVideoId(currentLiveClass.data().youtubeUrl) ? (
                            <YouTubePlayer videoId={getYoutubeVideoId(currentLiveClass.data().youtubeUrl)!} />
                        ) : (
                            <p className="text-destructive">Invalid YouTube URL for this live class.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {!currentLiveClass && !loading && (
                <Card className="text-center p-8">
                    <CardTitle>No Class is Live Right Now</CardTitle>
                    <CardDescription>Check the upcoming classes below.</CardDescription>
                </Card>
            )}


            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Upcoming Classes</h2>
                {upcomingClasses && upcomingClasses.length > 0 ? (
                    upcomingClasses.map(doc => {
                         const liveClass = doc.data();
                         const startTime = liveClass.startTime?.toDate();
                         if (!startTime) return null;
                         return (
                            <Card key={doc.id}>
                                <CardHeader>
                                    <CardTitle>{liveClass.title}</CardTitle>
                                    <CardDescription>{startTime.toLocaleString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Countdown targetDate={startTime} />
                                </CardContent>
                            </Card>
                         )
                    })
                ) : (
                    !loading && <p>No upcoming classes scheduled.</p>
                )}
            </div>
        </div>
    );
}
