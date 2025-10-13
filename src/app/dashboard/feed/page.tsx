
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Rss, PlusCircle, Image as ImageIcon, MessageSquare, Send, Heart, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';

const PollComponent = ({ post }: { post: any }) => {
    const { user } = useAuth();
    const [votedOption, setVotedOption] = useState<string | null>(null);

    // Check if user has already voted
    useState(() => {
        if (user) {
            post.data.pollOptions.forEach((opt: any, index: number) => {
                if (opt.votes.includes(user.uid)) {
                    setVotedOption(opt.text);
                }
            });
        }
    });

    const handleVote = async (optionText: string) => {
        if (!user || votedOption) return;

        const postRef = doc(firestore, 'feedPosts', post.id);
        const updatedOptions = post.data.pollOptions.map((opt: any) => {
            if (opt.text === optionText) {
                return { ...opt, votes: [...opt.votes, user.uid] };
            }
            return opt;
        });

        await updateDoc(postRef, { pollOptions: updatedOptions });
        setVotedOption(optionText);
    };

    const totalVotes = post.data.pollOptions.reduce((acc: number, opt: any) => acc + opt.votes.length, 0);

    return (
        <div className="space-y-2">
            {post.data.pollOptions.map((option: any, index: number) => {
                const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                const isVotedFor = votedOption === option.text;

                return (
                    <div key={index} onClick={() => handleVote(option.text)} className="relative border rounded-md p-2 cursor-pointer hover:bg-muted">
                        {votedOption && (
                            <div
                                className="absolute top-0 left-0 h-full bg-primary/20 rounded-md transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                        )}
                        <div className="relative z-10 flex justify-between items-center">
                            <span className="font-medium">{option.text} {isVotedFor && <Check className="inline h-4 w-4 text-primary"/>}</span>
                            {votedOption && <span className="text-sm font-semibold">{percentage.toFixed(0)}%</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const PostCard = ({ post }: { post: any }) => {
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [comments, commentsLoading] = useCollection(
        query(collection(firestore, 'feedPosts', post.id, 'comments'), orderBy('createdAt', 'desc'))
    );

    const isLiked = user && post.data.likes?.includes(user.uid);

    const handleLike = async () => {
        if (!user) return;
        const postRef = doc(firestore, 'feedPosts', post.id);
        await updateDoc(postRef, {
            likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !comment.trim()) return;
        setIsCommenting(true);
        try {
            await addDoc(collection(firestore, 'feedPosts', post.id, 'comments'), {
                authorId: user.uid,
                authorName: user.displayName,
                authorAvatar: user.photoURL,
                content: comment.trim(),
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(firestore, 'feedPosts', post.id), {
                commentsCount: increment(1)
            });
            setComment('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsCommenting(false);
        }
    };
    
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="overflow-hidden shadow-lg">
            <CardHeader className="p-4">
                 <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.data.authorAvatar} />
                        <AvatarFallback>{post.data.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">{post.data.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                            {post.data.createdAt ? formatDistanceToNow(post.data.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-2 space-y-4">
                {post.data.content && <p className="whitespace-pre-wrap">{post.data.content}</p>}
                
                {post.data.type === 'poll' && (
                    <PollComponent post={post} />
                )}

                {post.data.type === 'text' && post.data.imageUrl && (
                    <div className="relative max-h-[60vh] w-full rounded-lg overflow-hidden border flex justify-center bg-black/50">
                        <Image 
                            src={post.data.imageUrl} 
                            alt="Post content" 
                            width={800} 
                            height={800}
                            className="object-contain w-auto h-auto max-w-full max-h-[60vh]"
                         />
                    </div>
                )}
            </CardContent>
             <CardFooter className="p-4 flex justify-around items-center border-t">
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike}>
                    <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                    <span>{post.data.likes?.length || 0}</span>
                </Button>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setShowComments(!showComments)}>
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span>{post.data.commentsCount || 0}</span>
                </Button>
            </CardFooter>
            <AnimatePresence>
                {showComments && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                         <div className="p-4 border-t bg-muted/50">
                             {user && (
                                <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
                                    <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." />
                                    <Button type="submit" size="icon" disabled={isCommenting}>
                                        {isCommenting ? <Loader2 className="animate-spin" /> : <Send />}
                                    </Button>
                                </form>
                             )}
                             <div className="space-y-3 max-h-60 overflow-y-auto">
                                {commentsLoading && <Skeleton className="h-12 w-full" />}
                                {comments?.docs.map(c => {
                                    const commentData = c.data();
                                    return (
                                        <div key={c.id} className="flex gap-2 text-sm">
                                             <Avatar className="h-8 w-8">
                                                <AvatarImage src={commentData.authorAvatar} />
                                                <AvatarFallback>{commentData.authorName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="bg-background rounded-lg p-2 flex-1">
                                                <p className="font-semibold">{commentData.authorName}</p>
                                                <p>{commentData.content}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
        </motion.div>
    );
}

export default function FeedPage() {
    const { user } = useAuth();
    const [posts, loading, error] = useCollection(
        query(collection(firestore, 'feedPosts'), orderBy('createdAt', 'desc'))
    );
    

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
             <div className="text-center pb-4">
                <Rss className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-3xl font-bold font-headline">Community Feed</h1>
                <p className="text-muted-foreground mt-2">Connect, share, and learn with the community.</p>
            </div>

            {user && (
                <Link href="/dashboard/feed/create">
                    <Card className="cursor-pointer hover:bg-muted transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="w-full justify-start text-muted-foreground">
                                What's on your mind, {user.displayName?.split(' ')[0]}?
                            </div>
                            <Button size="icon" variant="ghost">
                                <PlusCircle />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            )}

            <div className="space-y-4">
                {loading && [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                {error && <p className="text-destructive">Error loading posts: {error.message}</p>}
                
                <AnimatePresence>
                    {posts?.docs.map(post => (
                        <PostCard key={post.id} post={{ id: post.id, data: post.data() }} />
                    ))}
                </AnimatePresence>

                {!loading && posts?.empty && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>The feed is empty. Be the first to post!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
