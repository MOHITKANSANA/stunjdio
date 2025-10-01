
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { doc, collection, query, orderBy, onSnapshot, where, getDoc, limit, addDoc, serverTimestamp } from 'firebase/firestore';
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
import YouTubePlayer from './youtube-player';

const ChatSection = ({ classId }: { classId: string }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const q = query(
            collection(firestore, 'liveClassChats'),
            where('classId', '==', classId),
            orderBy('createdAt', 'asc')
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        <div className="flex flex-col h-full bg-background">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.userPhoto || undefined} />
                            <AvatarFallback>{msg.userName?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{msg.userName}</p>
                            <p className="text-sm break-words">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            {user && (
                <form onSubmit={handleSendMessage} className="p-2 border-t flex items-center gap-2 bg-background shrink-0">
                    <Input 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
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
    const params = useParams() as { classId: string };
    const classId = params.classId;
    
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
        return <div className="p-0"><Skeleton className="w-full aspect-video" /></div>
    }
    if (error || !classDoc?.exists()) {
        notFound();
    }
    
    const liveClass = classDoc.data();
    const videoId = getYoutubeVideoId(liveClass.youtubeUrl);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] bg-background overflow-hidden">
            <div className="md:w-[calc(100%-350px)] md:h-full flex flex-col">
                <div className="w-full shrink-0">
                    <YouTubePlayer videoId={videoId} />
                </div>
                 <div className="flex-grow min-h-0 hidden md:block p-4">
                     <h1 className="text-2xl font-bold">{liveClass.title}</h1>
                     <p className="text-muted-foreground">{liveClass.startTime?.toDate()?.toLocaleString()}</p>
                </div>
            </div>
            
            <div className="flex-grow min-h-0 md:hidden">
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

            <div className="hidden md:block md:w-[350px] md:h-full border-l">
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
