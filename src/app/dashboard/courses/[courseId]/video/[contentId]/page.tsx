

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { doc, collection, query, orderBy, onSnapshot, where, getDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, BookText, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveNoteAction } from '@/app/actions/live-class';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';


const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    try {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
    } catch (e) {
        console.error("Error parsing YouTube URL", e);
    }
    return null;
}

const getZohoVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        // Handle Zoho Show Public links
        const zohoPublicRegex = /show\.zohopublic\.(in|com)\/publish\/([a-zA-Z0-9_-]+)/;
        const publicMatch = url.match(zohoPublicRegex);
        if (publicMatch && publicMatch[2]) {
            return `https://show.zohopublic.in/publish/${publicMatch[2]}?viewtype=embed`;
        }

        // Handle Zoho Workdrive file links
        const zohoWorkdriveRegex = /workdrive\.zoho\.(in|com)\/file\/([a-zA-Z0-9_-]+)/;
        const workdriveMatch = url.match(zohoWorkdriveRegex);
        if (workdriveMatch && workdriveMatch[2]) {
            return `https://workdrive.zoho.in/embed/${workdriveMatch[2]}`;
        }
    } catch(e) {
        console.error("Error parsing Zoho URL", e);
    }
    return null;
};

const getGoogleDriveEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        const googleDriveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(googleDriveRegex);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    } catch (e) {
        console.error("Error parsing Google Drive URL", e);
    }
    return null;
}


const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
    const youtubeVideoId = getYoutubeVideoId(videoUrl);
    const zohoEmbedUrl = getZohoVideoEmbedUrl(videoUrl);
    const googleDriveEmbedUrl = getGoogleDriveEmbedUrl(videoUrl);
    const isSupabaseLink = videoUrl?.includes('supabase');


    let embedUrl = null;
    let type = 'other';

    if (youtubeVideoId) {
        embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`;
        type = 'youtube';
    } else if (zohoEmbedUrl) {
        embedUrl = zohoEmbedUrl;
        type = 'zoho';
    } else if (googleDriveEmbedUrl) {
        embedUrl = googleDriveEmbedUrl;
        type = 'googledrive';
    } else if (videoUrl?.match(/\.(mp4|webm|ogg)$/i) || isSupabaseLink) {
        embedUrl = videoUrl;
        type = 'direct';
    }

    if (type === 'youtube' || type === 'zoho' || type === 'googledrive') {
        return (
            <div className="w-full aspect-video">
                <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl!}
                    title="Course Video Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="rounded-lg"
                ></iframe>
            </div>
        );
    }
    
    if (type === 'direct') {
        return (
             <div className="w-full aspect-video bg-black rounded-lg">
                <video
                    controls
                    autoPlay
                    src={embedUrl!}
                    className="w-full h-full rounded-lg"
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        )
    }

    return (
        <div className="w-full aspect-video bg-black text-white flex items-center justify-center rounded-lg">
            <p>Unsupported video URL. Please check the link format.</p>
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
    const [chats, setChats] = useState<any[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const q = query(collection(firestore, 'videoChats', contentId, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChats(fetchedChats);
            setChatsLoading(false);
        }, (error) => {
            console.error("Error fetching chats:", error);
            setChatsLoading(false);
        });
        return () => unsubscribe();
    }, [contentId]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chats]);

    const handleDoubtSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !doubtText.trim()) return;
        try {
            await addDoc(collection(firestore, 'videoChats', contentId, 'messages'), {
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
            <ScrollArea className="flex-grow mb-4 h-64" ref={scrollAreaRef}>
                <div className="space-y-4 pr-4">
                    {chatsLoading && <Skeleton className="h-20 w-full" />}
                    {chats.map(chat => {
                        const isCurrentUser = user?.uid === chat.userId;
                        return (
                            <div key={chat.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                                 {!isCurrentUser && (
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={chat.userPhoto || undefined} />
                                        <AvatarFallback style={{ backgroundColor: `#${intToRGB(hashCode(chat.userName || 'U'))}` }}>{chat.userName?.charAt(0) || 'A'}</AvatarFallback>
                                    </Avatar>
                                 )}
                                <div className={`p-3 rounded-lg max-w-xs break-words ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {!isCurrentUser && <p className="font-semibold text-sm">{chat.userName}</p>}
                                    <p className="whitespace-pre-wrap">{chat.text}</p>
                                </div>
                                  {isCurrentUser && (
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage src={chat.userPhoto || undefined} />
                                        <AvatarFallback style={{ backgroundColor: `#${intToRGB(hashCode(chat.userName || 'U'))}` }}>{chat.userName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                 )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
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
                where('classId', '==', contentId),
                where('userId', '==', user.uid),
                limit(1)
            );
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    setNotes(doc.data().content);
                } else {
                    setNotes('');
                }
            }, (error) => {
                 console.error("Error fetching notes:", error);
                 toast({ variant: 'destructive', description: "Could not load your notes." });
            });
            return () => unsubscribe();
        }
    }, [contentId, user, toast]);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };
    
    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const result = await saveNoteAction(contentId, user.uid, notes);
        if (result.success) {
            toast({ description: 'Notes saved successfully.' });
        } else {
            toast({ variant: 'destructive', description: result.error || 'Failed to save notes.' });
        }
        setIsSaving(false);
    };

    
    return (
        <div className="p-4 flex flex-col h-full">
            <Textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Write your personal notes here... they are only visible to you. Click save to store them."
                className="flex-1 min-h-[200px]"
            />
            <Button onClick={handleSave} disabled={isSaving} className="mt-4">
                <Save className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Notes'}
            </Button>
        </div>
    );
};


export default function VideoPlaybackPage() {
    const params = useParams() as { courseId: string; contentId: string };
    const courseId = params.courseId;
    const contentId = params.contentId;
    
    const [contentDoc, loading, error] = useDocument(doc(firestore, 'courses', courseId, 'content', contentId));
    const { user } = useAuth();
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!user || !contentDoc?.exists()) return;
        const content = contentDoc.data();
        if (getYoutubeVideoId(content.url)) {
            toast({ variant: 'destructive', description: "YouTube videos cannot be downloaded." });
            return;
        }

        try {
            await addDoc(collection(firestore, 'userDownloads'), {
                userId: user.uid,
                title: content.title,
                url: content.url,
                type: 'Video',
                savedAt: serverTimestamp()
            });
            toast({ description: "Added to your downloads." });
        } catch (e) {
            toast({ variant: 'destructive', description: "Failed to add to downloads." });
        }
    };


    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col">
                 <div className="w-full">
                    <Skeleton className="w-full aspect-video" />
                </div>
                 <div className="p-4"><Skeleton className="h-8 w-3/4" /></div>
                 <div className="flex-1 p-4"><Skeleton className="w-full h-full" /></div>
            </div>
        )
    }

    if (error || !contentDoc?.exists() || contentDoc.data()?.type !== 'video') {
        notFound();
    }
    
    const content = contentDoc.data();
    const canDownload = !getYoutubeVideoId(content.url);


    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
             <div className="w-full">
                <VideoPlayer videoUrl={content.url} />
            </div>
            <div className="flex-grow min-h-0 flex flex-col">
                <div className="p-4 border-b">
                     <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold break-words">{content.title}</h1>
                            {content.introduction && <p className="text-muted-foreground text-sm mt-1">{content.introduction}</p>}
                        </div>
                         {canDownload && (
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        )}
                    </div>
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
