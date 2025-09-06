
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Clock, PlayCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const YouTubePlayer = ({ videoId }: { videoId: string }) => {
    return (
        <div className="aspect-video">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-lg"
            ></iframe>
        </div>
    );
};

export default function LiveClassPage() {
    const [liveClasses, loading, error] = useCollection(
        query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc'))
    );
    const [now, setNow] = useState(new Date());
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>('');


    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getYoutubeVideoId = (url: string): string | null => {
        if (!url) return null;
        let videoId: string | null = null;
        try {
            const patterns = [
                /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    videoId = match[1];
                    break;
                }
            }
        } catch (e) {
            console.error("Error parsing YouTube URL", e);
            return null;
        }
        return videoId;
    }
    
    const openPlayer = (videoUrl: string, title: string) => {
        const videoId = getYoutubeVideoId(videoUrl);
        if (videoId) {
            setSelectedVideoId(videoId);
            setSelectedVideoTitle(title);
            setIsPlayerOpen(true);
        } else {
            // Handle invalid URL case, maybe show a toast
            console.error("Invalid YouTube URL provided.");
        }
    };


    const currentLiveClass = liveClasses?.docs.find(doc => {
        const startTime = doc.data().startTime?.toDate();
        // A class is "live" if it's the most recent class that has started.
        return startTime && startTime <= now;
    });

    const upcomingClasses = liveClasses?.docs.filter(doc => {
        const startTime = doc.data().startTime?.toDate();
        return startTime && startTime > now;
    }).reverse(); // reverse to show nearest upcoming first

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Live Classes</h1>
                <p className="text-muted-foreground mt-2">Join our live sessions and learn from experts in real-time.</p>
            </div>
            
            <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
                <DialogContent className="max-w-3xl p-4">
                    <DialogHeader>
                        <DialogTitle>{selectedVideoTitle}</DialogTitle>
                    </DialogHeader>
                    {selectedVideoId && <YouTubePlayer videoId={selectedVideoId} />}
                    <div className="flex justify-end mt-2">
                        <Button asChild>
                            <Link href={`https://www.youtube.com/live_chat?v=${selectedVideoId}`} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="mr-2 h-4 w-4" /> Open Live Chat
                            </Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {loading && <Skeleton className="w-full h-48" />}
            
            {error && <p className="text-destructive">Error: {error.message}</p>}

            {currentLiveClass && (
                <Card className="shadow-lg border-destructive">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                            <Badge variant="destructive" className="animate-pulse mb-2">LIVE NOW</Badge>
                             <CardTitle>{currentLiveClass.data().title}</CardTitle>
                             <CardDescription>Join the session by clicking the button below.</CardDescription>
                           </div>
                           <Video className="h-8 w-8 text-destructive" />
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Button className="w-full" onClick={() => openPlayer(currentLiveClass.data().youtubeUrl, currentLiveClass.data().title)}>
                           <PlayCircle className="mr-2" /> Play Live Video
                       </Button>
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
                <h2 className="text-2xl font-bold font-headline">Upcoming & Past Classes</h2>
                {liveClasses && liveClasses.docs.length > 0 ? (
                    liveClasses.docs.map(doc => {
                         const liveClass = doc.data();
                         if (doc.id === currentLiveClass?.id) return null; // Don't show the current live class again
                         const startTime = liveClass.startTime?.toDate();
                         if (!startTime) return null;
                         const isUpcoming = startTime > now;
                         return (
                            <Card key={doc.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                       <CardTitle>{liveClass.title}</CardTitle>
                                       {isUpcoming && <Badge variant="secondary">Upcoming</Badge>}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                       <Clock className="h-4 w-4" />
                                       <span>Starts at: {startTime.toLocaleString()}</span>
                                    </div>
                                    <Button variant="outline" onClick={() => openPlayer(liveClass.youtubeUrl, liveClass.title)}>
                                        <PlayCircle className="mr-2 h-4 w-4"/> Watch Video
                                    </Button>
                                </CardContent>
                            </Card>
                         )
                    })
                ) : (
                    !loading && <p>No classes scheduled.</p>
                )}
            </div>
        </div>
    );
}
