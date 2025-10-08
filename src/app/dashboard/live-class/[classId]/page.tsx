
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { doc, collection, query, orderBy, onSnapshot, where, getDoc, addDoc, serverTimestamp, deleteDoc, limit } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, BookText, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveNoteAction } from '@/app/actions/doubts';
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
        const zohoPublicRegex = /show\.zohopublic\.(in|com)\/publish\/([a-zA-Z0-9_-]+)/;
        const publicMatch = url.match(zohoPublicRegex);
        if (publicMatch && publicMatch[2]) {
            return `https://show.zohopublic.in/publish/${publicMatch[2]}?viewtype=embed`;
        }

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

const getAtoplayEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        // Updated regex to handle the new URL format
        const atoplayRegex = /atoplay\.com\/video\/([a-zA-Z0-9_-]+)/;
        const match = url.match(atoplayRegex);
        if (match && match[1]) {
            // Correct embed format is with /embed/ not /embed?v=
            return `https://atoplay.com/embed/${match[1]}`;
        }
    } catch (e) {
        console.error("Error parsing Atoplay URL", e);
    }
    return null;
};

const getRumbleEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        const rumbleRegex = /rumble\.com\/v([a-zA-Z0-9]+)-/;
        const match = url.match(rumbleRegex);
        if (match && match[1]) {
            return `https://rumble.com/embed/v${match[1]}/`;
        }
    } catch (e) {
        console.error("Error parsing Rumble URL", e);
    }
    return null;
}

const VideoPlayer = ({ videoUrl }: { videoUrl: string }) => {
    let embedUrl;
    let playerType = 'iframe'; 

    const youtubeId = getYoutubeVideoId(videoUrl);
    const zohoUrl = getZohoVideoEmbedUrl(videoUrl);
    const googleDriveUrl = getGoogleDriveEmbedUrl(videoUrl);
    const atoplyUrl = getAtoplayEmbedUrl(videoUrl);
    const rumbleUrl = getRumbleEmbedUrl(videoUrl);
    const isDirectLink = videoUrl?.match(/\.(mp4|webm|ogg)$/i) || videoUrl?.includes('supabase');
    
    if (youtubeId) {
        embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    } else if (zohoUrl) {
        embedUrl = zohoUrl;
    } else if (googleDriveUrl) {
        embedUrl = googleDriveUrl;
    } else if (atoplyUrl) {
        embedUrl = atoplyUrl;
    } else if (rumbleUrl) {
        embedUrl = rumbleUrl;
    } else if (isDirectLink) {
        embedUrl = videoUrl;
        playerType = 'video';
    } else {
        embedUrl = videoUrl; 
    }

    if (!embedUrl) {
        return (
            <div className="w-full aspect-video bg-black text-white flex items-center justify-center rounded-lg">
                <p>Unsupported video URL. Please check the link format.</p>
            </div>
        );
    }

    return (
        <div className="w-full aspect-video bg-black rounded-lg">
            {playerType === 'video' ? (
                <video controls autoPlay src={embedUrl} className="w-full h-full rounded-lg">
                    Your browser does not support the video tag.
                </video>
            ) : (
                <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Course Video Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="rounded-lg"
                ></iframe>
            )}
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

const ChatSection = ({ classId }: { classId: string }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [doubtText, setDoubtText] = useState('');
    const [chats, setChats] = useState<any[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const q = query(collection(firestore, 'liveClassChats', classId, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChats(fetchedChats);
            setChatsLoading(false);
        }, (error) => {
            console.error("Error fetching chats:", error);
            setChatsLoading(false);
        });
        return () => unsubscribe();
    }, [classId]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chats]);

    const handleDoubtSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !doubtText.trim()) return;
        try {
            await addDoc(collection(firestore, 'liveClassChats', classId, 'messages'), {
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


const NotesSection = ({ classId }: { classId: string }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (user) {
            const q = query(
                collection(firestore, 'liveClassNotes'),
                where('classId', '==', classId),
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
    }, [classId, user, toast]);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };
    
    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const result = await saveNoteAction(classId, user.uid, notes);
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


export default function LiveClassPlaybackPage() {
    const params = useParams() as { classId: string };
    const classId = params.classId;
    
    const [liveClassDoc, loading, error] = useDocument(doc(firestore, 'live_classes', classId));
    
    if (loading) {
        return (
            <div className="flex flex-col h-screen bg-background overflow-hidden">
                 <div className="w-full">
                    <Skeleton className="w-full aspect-video" />
                </div>
                 <div className="p-4"><Skeleton className="h-8 w-3/4" /></div>
                 <div className="flex-1 p-4"><Skeleton className="w-full h-full" /></div>
            </div>
        )
    }

    if (error || !liveClassDoc?.exists()) {
        notFound();
    }
    
    const liveClass = liveClassDoc.data();

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
             <div className="w-full">
                <VideoPlayer videoUrl={liveClass.videoUrl} />
            </div>
            <div className="flex-grow min-h-0 flex flex-col">
                <div className="p-4 border-b">
                     <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold break-words">{liveClass.title}</h1>
                            {liveClass.startTime && <p className="text-muted-foreground text-sm mt-1">{liveClass.startTime.toDate().toLocaleString()}</p>}
                        </div>
                    </div>
                </div>
                <div className="flex-grow min-h-0">
                    <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 shrink-0">
                            <TabsTrigger value="chat"><MessageSquare className="mr-2"/>Live Chat</TabsTrigger>
                            <TabsTrigger value="notes"><BookText className="mr-2"/>My Notes</TabsTrigger>
                        </TabsList>
                        <TabsContent value="chat" className="flex-grow min-h-0">
                            <ChatSection classId={classId} />
                        </TabsContent>
                        <TabsContent value="notes" className="flex-grow min-h-0">
                            <NotesSection classId={classId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
