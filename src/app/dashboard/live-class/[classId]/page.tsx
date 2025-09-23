

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { doc, collection, query, orderBy, onSnapshot, where, limit, getDoc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, BookText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addChatMessageAction, saveNoteAction } from '@/app/actions/live-class';
import { Input } from '@/components/ui/input';

const YouTubePlayer = ({ videoId }: { videoId: string }) => {
    return (
        <div className="w-full aspect-video">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=0&showinfo=0&modestbranding=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
    );
};

const ChatSection = ({ classId }: { classId: string }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const q = query(
            collection(firestore, 'liveClassChats'),
            where('classId', '==', classId)
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            msgs.sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [classId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;
        await addChatMessageAction(classId, user.uid, user.displayName || 'Anonymous', user.photoURL, newMessage);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.userPhoto || undefined} />
                            <AvatarFallback>{msg.userName?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{msg.userName}</p>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            {user && (
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                    <Input 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <Send />
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
    const [docId, setDocId] = useState<string | null>(null);

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
                    setDocId(doc.id);
                } else {
                    setNotes('');
                    setDocId(null);
                }
            });
            return () => unsubscribe();
        }
    }, [classId, user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const result = await saveNoteAction(classId, user.uid, notes);
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

export default function LiveClassPlayerPage() {
    const params = useParams();
    const classId = params.classId as string;

    const [classDoc, loading, error] = useDocument(doc(firestore, 'live_classes', classId));

    const getYoutubeVideoId = (url: string): string | null => {
        if (!url) return null;
        try {
            const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (e) {
            console.error("Error parsing YouTube URL", e);
            return null;
        }
    }
    
    if (loading) {
        return <div className="p-4"><Skeleton className="w-full aspect-video" /></div>
    }
    if (error || !classDoc?.exists()) {
        notFound();
    }
    
    const liveClass = classDoc.data();
    const videoId = getYoutubeVideoId(liveClass.youtubeUrl);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
            <div className="w-full">
                {videoId ? <YouTubePlayer videoId={videoId} /> : <div className="aspect-video bg-black text-white flex items-center justify-center"><p>Invalid or unsupported YouTube video URL.</p></div>}
            </div>
            
            <div className="flex-grow min-h-0">
                <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 shrink-0">
                        <TabsTrigger value="chat"><MessageSquare className="mr-2"/>Chat</TabsTrigger>
                        <TabsTrigger value="notes"><BookText className="mr-2"/>Add Notes</TabsTrigger>
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
    );
}
