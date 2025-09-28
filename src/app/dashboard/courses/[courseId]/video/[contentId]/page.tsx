

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { doc, collection, query, orderBy, onSnapshot, where, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, BookText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveNoteAction } from '@/app/actions/live-class';
import { Input } from '@/components/ui/input';


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

const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
    const youtubeVideoId = getYoutubeVideoId(videoUrl);

    if (!youtubeVideoId) {
        return (
            <div className="w-full aspect-video bg-black text-white flex items-center justify-center rounded-lg">
                <p>Unsupported video URL.</p>
            </div>
        )
    }

    return (
        <div className="w-full aspect-video">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                title="Course Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-lg"
            ></iframe>
        </div>
    );
};

const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

const intToRGB = (i: number) => {
    const c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
}

const ChatSection = ({ contentId }: { contentId: string }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [doubtText, setDoubtText] = useState('');
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    // Use contentId to create a unique collection path for each video's chat
    const chatsCollectionRef = collection(firestore, 'videoChats', contentId, 'messages');
    const [chatsCollection, chatsLoading, chatsError] = useCollection(
        query(chatsCollectionRef, orderBy('createdAt', 'asc'))
    );
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatsCollection]);

    const handleDoubtSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !doubtText.trim()) return;
        try {
            await addDoc(chatsCollectionRef, {
                text: doubtText,
                userId: user.uid,
                userName: user.displayName,
                userPhoto: user.photoURL,
                createdAt: serverTimestamp(),
            });
            setDoubtText('');
        } catch (error: any) {
            toast({ variant: 'destructive', description: `Could not submit your message: ${error.message}` });
        }
    };

    return (
        <div className="flex flex-col h-full bg-background p-4">
            <div className="flex-grow overflow-y-auto space-y-4 mb-4">
                {chatsLoading && <Skeleton className="h-20 w-full" />}
                {chatsError && <p className="text-destructive">Could not load chats.</p>}
                {chatsCollection?.docs.map(doc => {
                    const chat = doc.data();
                    const isCurrentUser = user?.uid === chat.userId;
                    return (
                        <div key={doc.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                             {!isCurrentUser && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={chat.userPhoto || undefined} />
                                    <AvatarFallback style={{ backgroundColor: `#${intToRGB(hashCode(chat.userName || 'U'))}` }}>{chat.userName?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                             )}
                            <div className={`p-3 rounded-lg max-w-xs break-words ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {!isCurrentUser && <p className="font-semibold text-sm">{chat.userName}</p>}
                                <p>{chat.text}</p>
                            </div>
                              {isCurrentUser && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={chat.userPhoto || undefined} />
                                    <AvatarFallback style={{ backgroundColor: `#${intToRGB(hashCode(chat.userName || 'U'))}` }}>{chat.userName?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                             )}
                        </div>
                    )
                })}
                <div ref={chatEndRef} />
            </div>
            {user && (
                <form onSubmit={handleDoubtSubmit} className="flex items-center gap-2 bg-background shrink-0">
                    <Input 
                        value={doubtText} 
                        onChange={(e) => setDoubtText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 h-9"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9">
                        <Send size={18}/>
                    </Button>
                </form>
            )}
        </div>
    );
};


const NotesSection = ({ contentId }: { contentId: string }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(firestore, 'liveClassNotes'),
                where('classId', '==', contentId), // Using classId as a generic content ID
                where('userId', '==', user.uid),
            );
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    setNotes(doc.data().content);
                } else {
                    setNotes('');
                }
            });
            return () => unsubscribe();
        }
    }, [contentId, user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const result = await saveNoteAction(contentId, user.uid, notes);
        if (result.success) {
            toast({ description: 'Notes saved successfully.' });
        } else {
            toast({ variant: 'destructive', description: 'Failed to save notes.' });
        }
        setIsSaving(false);
    };

    return (
        <div className="p-4 flex flex-col h-full">
            <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your personal notes here... they are only visible to you."
                className="flex-1 min-h-[200px]"
            />
            <Button onClick={handleSave} disabled={isSaving} className="mt-4">
                {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
        </div>
    );
};


export default function VideoPlaybackPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const contentId = params.contentId as string;
    
    const [contentDoc, loading, error] = useDocument(doc(firestore, 'courses', courseId, 'content', contentId));

    if (loading) {
        return <div className="p-0"><Skeleton className="w-full aspect-video" /></div>
    }

    if (error || !contentDoc?.exists() || contentDoc.data()?.type !== 'video') {
        notFound();
    }
    
    const content = contentDoc.data();

    return (
        <div className="flex flex-col md:flex-row h-full max-h-[calc(100vh-4rem)] bg-background overflow-hidden">
             <div className="flex-grow flex flex-col md:w-[calc(100%-350px)]">
                <div className="sticky top-0 z-10 w-full shrink-0">
                    <VideoPlayer videoUrl={content.url} />
                </div>
                 <div className="p-4 border-b">
                     <h1 className="text-xl font-bold">{content.title}</h1>
                     {content.introduction && <p className="text-muted-foreground text-sm mt-1">{content.introduction}</p>}
                </div>
                <div className="flex-grow min-h-0">
                    <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 shrink-0">
                            <TabsTrigger value="chat"><MessageSquare className="mr-2"/>Chat</TabsTrigger>
                            <TabsTrigger value="notes"><BookText className="mr-2"/>My Notes</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chat" className="flex-grow min-h-0">
                            <ChatSection contentId={contentId} />
                        </TabsContent>
                        <TabsContent value="notes" className="flex-grow min-h-0">
                            <NotesSection contentId={contentId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

