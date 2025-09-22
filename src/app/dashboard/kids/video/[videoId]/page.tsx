
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { doc, collection, query, orderBy, where, getDoc, limit, onSnapshot } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { handleLikeDislikeAction, addDoubtAction, addReplyAction, handleFollowAction } from '@/app/actions/kids-tube';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
    // A simple heuristic to check if it's a YouTube URL
    const isYoutubeUrl = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    let embedUrl = videoUrl;

    if (isYoutubeUrl) {
        try {
            const url = new URL(videoUrl);
            let videoId = url.searchParams.get('v');
            if (url.hostname === 'youtu.be') {
                videoId = url.pathname.slice(1);
            }
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } catch (e) {
            console.error("Invalid YouTube URL", e);
            // Fallback to direct URL if parsing fails
            embedUrl = videoUrl;
        }
    }

    return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
                src={embedUrl}
                title="Video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
            ></iframe>
        </div>
    );
};


const DoubtItem = ({ doubt, doubtId }: { doubt: any, doubtId: string }) => {
    const { user } = useAuth();
    const [replyText, setReplyText] = useState('');
    const [showReplyInput, setShowReplyInput] = useState(false);

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !replyText.trim()) return;
        await addReplyAction(doubtId, user.uid, user.displayName || 'Anonymous', user.photoURL, replyText);
        setReplyText('');
        setShowReplyInput(false);
    };

    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={doubt.userPhoto || undefined} />
                <AvatarFallback>{doubt.userName?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold text-sm">{doubt.userName}</p>
                <p className="text-sm">{doubt.text}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <button className="hover:text-primary">Like</button>
                    <button className="hover:text-primary" onClick={() => setShowReplyInput(!showReplyInput)}>Reply</button>
                </div>

                {showReplyInput && (
                    <form onSubmit={handleReplySubmit} className="flex items-center gap-2 mt-2">
                        <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Add a reply..." className="h-9" />
                        <Button type="submit" size="sm">Reply</Button>
                    </form>
                )}

                {doubt.replies && doubt.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l">
                        {doubt.replies.map((reply: any) => (
                             <div key={reply.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={reply.userPhoto || undefined} />
                                    <AvatarFallback>{reply.userName?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{reply.userName}</p>
                                    <p className="text-sm">{reply.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}


export default function VideoPage() {
    const params = useParams();
    const videoId = params.videoId as string;
    const { user } = useAuth();
    const { toast } = useToast();
    const [doubtText, setDoubtText] = useState('');
    const [showDescription, setShowDescription] = useState(false);
    const [hasFollowed, setHasFollowed] = useState(false);
    const [followers, setFollowers] = useState(0);

    const [videoDoc, loading, error] = useDocument(doc(firestore, 'kidsTubeVideos', videoId));
    const [doubts, doubtsLoading] = useCollection(query(collection(firestore, 'kidsTubeDoubts'), where('videoId', '==', videoId), orderBy('createdAt', 'desc')));
    
    // For "Up Next" videos
    const [relatedVideos, relatedVideosLoading] = useCollection(
        query(collection(firestore, 'kidsTubeVideos'), where('__name__', '!=', videoId), limit(5))
    );

    useEffect(() => {
        if (user) {
            // Check if user has followed
            const userDocRef = doc(firestore, 'users', user.uid);
            getDoc(userDocRef).then(doc => {
                if (doc.exists() && doc.data().hasFollowed) {
                    setHasFollowed(true);
                }
            });
        }

        // Get follower count
        const channelDocRef = doc(firestore, 'channels', 'gsc');
        const unsubscribe = onSnapshot(channelDocRef, (doc) => {
             if (doc.exists()) {
                setFollowers(doc.data().followers || 0);
            }
        });
        
        return () => unsubscribe();

    }, [user]);

    const handleLikeDislike = async (action: 'like' | 'dislike') => {
        if (!user) return toast({ variant: 'destructive', description: "You must be logged in." });
        const result = await handleLikeDislikeAction(videoId, user.uid, action);
        if (result.success && result.points) {
            toast({ description: `+${result.points} points for your feedback!` });
        } else if (result.error) {
            toast({ variant: 'destructive', description: result.error });
        }
    };

    const handleFollow = async () => {
         if (!user) return toast({ variant: 'destructive', description: "You must be logged in." });
         if (hasFollowed) return;
         const result = await handleFollowAction(user.uid);
         if (result.success) {
            setHasFollowed(true);
            toast({ description: result.message });
         } else if (result.error) {
            toast({ variant: 'destructive', description: result.error });
         }
    }

    const onDoubtSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !doubtText.trim()) return;
        await addDoubtAction(videoId, user.uid, user.displayName || "Anonymous", user.photoURL, doubtText);
        setDoubtText('');
    };
    
    if (loading) {
        return <div className="p-4"><Skeleton className="w-full aspect-video" /></div>
    }
    if (error || !videoDoc?.exists()) {
        notFound();
    }
    
    const video = videoDoc.data();

    return (
        <div className="flex flex-col md:flex-row max-w-7xl mx-auto p-4 gap-6">
            <div className="flex-grow">
                <VideoPlayer videoUrl={video.videoUrl} />
                <div className="py-4">
                    <h1 className="text-xl font-bold">{video.title}</h1>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-4">
                         <div className="flex items-center gap-3">
                             <Avatar>
                                <AvatarImage src="https://firebasestorage.googleapis.com/v0/b/go-swami-coching-classes.appspot.com/o/app_assets%2Flogo.png?alt=media&token=42558509-de60-4055-9b2f-7d28c46011b1" />
                                <AvatarFallback>GSC</AvatarFallback>
                             </Avatar>
                             <div>
                                <p className="font-semibold">Go Swami Coaching Classes</p>
                                <p className="text-xs text-muted-foreground">{followers} Followers</p>
                             </div>
                             <Button onClick={handleFollow} size="sm" disabled={hasFollowed} variant={hasFollowed ? 'secondary' : 'default'}>
                                {hasFollowed ? "Followed" : "Follow"}
                            </Button>
                         </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => handleLikeDislike('like')}>
                                <ThumbsUp className="mr-2" /> {video.likes || 0}
                            </Button>
                            <Button variant="outline" onClick={() => handleLikeDislike('dislike')}>
                                <ThumbsDown className="mr-2" /> {video.dislikes || 0}
                            </Button>
                        </div>
                    </div>
                     <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                        <p className={cn("whitespace-pre-wrap", !showDescription && "line-clamp-2")}>
                            {video.description || "No description available for this video."}
                        </p>
                        <button onClick={() => setShowDescription(!showDescription)} className="font-semibold mt-1">
                            {showDescription ? "Show less" : "Show more"}
                        </button>
                    </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare /> Ask a Doubt ({doubts?.docs.length || 0})
                    </h2>
                     {user && (
                        <form onSubmit={onDoubtSubmit} className="flex items-start gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                            </Avatar>
                            <Textarea
                                value={doubtText}
                                onChange={(e) => setDoubtText(e.target.value)}
                                placeholder="Ask your doubt here..."
                                className="flex-1"
                            />
                            <Button type="submit">
                                <Send />
                            </Button>
                        </form>
                    )}
                    <div className="space-y-6">
                        {doubtsLoading && <Skeleton className="h-20 w-full" />}
                        {doubts?.docs.map(doc => <DoubtItem key={doc.id} doubt={doc.data()} doubtId={doc.id} />)}
                    </div>
                </div>
            </div>
             <div className="w-full md:w-80 lg:w-96 shrink-0">
                <h3 className="text-lg font-bold mb-4">Up Next</h3>
                 <div className="space-y-3">
                     {relatedVideosLoading && [...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="w-32 h-20 shrink-0" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                     ))}
                     {relatedVideos?.docs.map(doc => {
                         const nextVideo = doc.data();
                         return (
                            <Link href={`/dashboard/kids/video/${doc.id}`} key={doc.id} className="flex gap-3 group">
                                <div className="w-32 h-20 shrink-0 relative rounded-lg overflow-hidden bg-muted">
                                    <Image src={nextVideo.thumbnailUrl || `https://picsum.photos/seed/${doc.id}/128/80`} alt={nextVideo.title} fill style={{objectFit: "cover"}} />
                                </div>
                                <div>
                                    <h4 className="font-semibold line-clamp-2 group-hover:text-primary">{nextVideo.title}</h4>
                                    <p className="text-xs text-muted-foreground">Go Swami Coaching</p>
                                </div>
                            </Link>
                         )
                     })}
                 </div>
            </div>
        </div>
    );
}
