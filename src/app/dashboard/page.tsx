

"use client";
import React, { useEffect, useState } from 'react';
import {
  Book,
  Video,
  Award,
  BookCopy,
  Newspaper,
  Youtube,
  Send,
  MessageSquare,
  Library,
  Clapperboard,
  PenSquare,
  Users,
  Lightbulb,
  Swords,
  Trophy,
  Calendar,
  BookOpen,
  Shield,
  User,
  FileText,
  Briefcase,
  Puzzle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import KidsTubeDashboard from './_components/kids-tube-dashboard';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useCollection } from 'react-firebase-hooks/firestore';

const topGridItems = [
    { label: "Today's Course", icon: BookOpen, href: "/dashboard/my-learning", color: "bg-red-500" },
    { label: "Upcoming Live Class", icon: Clapperboard, href: "/dashboard/live-classes", color: "bg-blue-500" },
    { label: "New Test Series", icon: FileText, href: "/dashboard/tests?tab=series", color: "bg-green-500" },
    { label: "Top Scorer of the Week", icon: Trophy, href: "/dashboard/leaderboard", color: "bg-yellow-500" },
];

const quickAccessItems = [
  { label: "Paid Courses", icon: Book, href: "/dashboard/courses" },
  { label: "Test Series", icon: Shield, href: "/dashboard/tests?tab=series" },
  { label: "Free Classes", icon: Video, href: "/dashboard/courses/free" },
  { label: "Previous Year Papers", icon: Newspaper, href: "/dashboard/papers" },
  { label: "Current Affairs", icon: Globe, href: "/dashboard/current-affairs" },
  { label: "Quiz & Games", icon: Puzzle, href: "/dashboard/quiz" },
  { label: "Our Books Notes PDF", icon: BookCopy, href: "/dashboard/my-learning?tab=ebooks" },
  { label: "Job Alerts", icon: Briefcase, href: "/dashboard/jobs" },
];


const LiveClassTimer = () => {
    const [liveClass, setLiveClass] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const q = query(collection(firestore, 'live_classes'), where('startTime', '>', new Date()), orderBy('startTime', 'asc'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setLiveClass({ id: doc.id, ...doc.data() });
            } else {
                setLiveClass(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!liveClass) return;
        const interval = setInterval(() => {
            const now = new Date();
            const startTime = liveClass.startTime.toDate();
            const diff = startTime.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft('Live now!');
                clearInterval(interval);
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [liveClass]);

    if (!liveClass) return null;

    return (
        <Card>
            <Link href={`/dashboard/live-class/${liveClass.id}`}>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg">Next Live Class Starts In:</CardTitle>
                    <CardDescription>{liveClass.title}</CardDescription>
                </div>
                <div className="text-2xl font-bold">{timeLeft}</div>
            </CardContent>
            </Link>
        </Card>
    );
};

const StudentReviews = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    return (
        <>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>Share your experience with us.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea placeholder="Write your review here..." />
                    <Button onClick={() => setIsDialogOpen(false)}>Submit Review</Button>
                </div>
            </DialogContent>
        </Dialog>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>What Our Students Say</CardTitle>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Write a Review</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="italic">"This platform transformed my preparation. The live classes are amazing!"</p>
                    <p className="font-semibold mt-2 text-right">- Priya Sharma</p>
                </div>
                 <div className="p-4 border rounded-lg bg-muted/50">
                    <p className="italic">"I love the AI tests. They help me identify my weak areas instantly."</p>
                    <p className="font-semibold mt-2 text-right">- Rahul Kumar</p>
                </div>
            </CardContent>
        </Card>
        </>
    )
};

const TopStudentsSection = () => {
    return (
        <Card>
            <CardHeader><CardTitle>Top 10 Students of the Week</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
                {[...Array(3)].map((_, i) => (
                    <div key={i}>
                        <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-yellow-400">
                            <AvatarImage src={`https://picsum.photos/seed/student${i+1}/100`} />
                            <AvatarFallback>{i+1}</AvatarFallback>
                        </Avatar>
                        <Badge variant="secondary" className="text-lg bg-yellow-400 text-black">{i+1}</Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

const EducatorsSection = () => {
    const [educators, loading] = useCollection(
        query(collection(firestore, 'educators'), orderBy('createdAt', 'desc'))
    );
    return (
        <Card>
            <CardHeader><CardTitle>Meet Our Educators</CardTitle></CardHeader>
            <CardContent>
                {loading && <Skeleton className="h-24 w-full" />}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {educators?.docs.map(doc => {
                        const educator = doc.data();
                        return (
                             <div key={doc.id} className="text-center">
                                <Avatar className="h-20 w-20 mx-auto">
                                    <AvatarImage src={educator.photoUrl} />
                                    <AvatarFallback>{educator.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold mt-2">{educator.name}</p>
                                <p className="text-xs text-muted-foreground">{educator.expertise}</p>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

const MainDashboard = () => {
    const { user } = useAuth();
    
    const getGreeting = () => {
        if (!user) return "Welcome!";
        const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
        if (isNewUser) return "Welcome to Go Swami X!";
        
        const name = user.displayName?.split(' ')[0] || 'Student';
        const hour = new Date().getHours();
        if (hour < 12) return `Good Morning, ${name}!`;
        if (hour < 18) return `Good Afternoon, ${name}!`;
        return `Good Evening, ${name}!`;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>

            <div className="grid grid-cols-2 gap-4">
                {topGridItems.map((item) => (
                     <Link href={item.href} key={item.label}>
                        <Card className={cn("text-white h-full hover:opacity-90 transition-opacity", item.color)}>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                <item.icon className="h-8 w-8" />
                                <span className="font-semibold">{item.label}</span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
            
            <div>
                <h2 className="text-xl font-bold mb-4">Quick Access</h2>
                <div className="grid grid-cols-4 gap-3">
                    {quickAccessItems.map(item => (
                        <Link href={item.href} key={item.label}>
                            <Card className="hover:bg-muted/50 transition-colors h-full">
                                 <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-1">
                                    <item.icon className="h-7 w-7 text-primary mb-1" />
                                    <span className="text-xs font-semibold">{item.label}</span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            <TopStudentsSection />
            <LiveClassTimer />
            <EducatorsSection />
            <StudentReviews />

        </div>
    );
};


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [isKidsMode, setIsKidsMode] = useState<boolean | null>(null);

    useEffect(() => {
        const checkUserProfile = async () => {
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setIsKidsMode(userData.ageGroup === '1-9');
                } else {
                    setIsKidsMode(false); // Default for older profiles
                }
            }
        };

        if (!authLoading) {
            checkUserProfile();
        }
    }, [user, authLoading]);

    if (authLoading || isKidsMode === null) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        )
    }

    return isKidsMode ? <KidsTubeDashboard /> : <MainDashboard />;
}
