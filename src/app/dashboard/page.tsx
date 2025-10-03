

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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
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

const carouselImages = [
    { src: 'https://picsum.photos/seed/promo1/1200/600', alt: 'Promotion 1', 'data-ai-hint': 'study class' },
    { src: 'https://picsum.photos/seed/promo2/1200/600', alt: 'Promotion 2', 'data-ai-hint': 'teacher lecture' },
    { src: 'https://picsum.photos/seed/promo3/1200/600', alt: 'Promotion 3', 'data-ai-hint': 'students writing' },
];

const dashboardGridItems: { label: string; icon: React.ElementType; href: string }[] = [
  { label: "My Learning", icon: Library, href: "/dashboard/my-learning" },
  { label: "Courses", icon: Book, href: "/dashboard/courses" },
  { label: "Live Classes", icon: Clapperboard, href: "/dashboard/live-classes" },
  { label: "AI Tests", icon: Shield, href: "/dashboard/tests" },
  { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers" },
  { label: "Scholarship", icon: Award, href: "/dashboard/scholarship" },
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
        <Card className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
            <Link href={`/dashboard/live-class/${liveClass.id}`}>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg">{liveClass.title}</CardTitle>
                    <CardDescription className="text-white/80">Next live class starts in:</CardDescription>
                </div>
                <div className="text-2xl font-bold">{timeLeft}</div>
            </CardContent>
            </Link>
        </Card>
    );
};

const StudentReviews = () => (
    <Card>
        <CardHeader>
            <CardTitle>What Our Students Say</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
                <p>"This platform transformed my preparation. The live classes are amazing!"</p>
                <p className="font-semibold mt-2 text-right">- Priya Sharma</p>
            </div>
             <div className="p-4 border rounded-lg">
                <p>"I love the AI tests. They help me identify my weak areas instantly."</p>
                <p className="font-semibold mt-2 text-right">- Rahul Kumar</p>
            </div>
        </CardContent>
    </Card>
);

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
        if (isNewUser) return "Welcome to Go Swami Coaching!";
        return `Hello, ${user.displayName || 'Student'}!`;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            
            <Carousel 
                opts={{ loop: true }} 
                plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
                className="w-full"
            >
                <CarouselContent>
                  {carouselImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="aspect-w-16 aspect-h-9">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              style={{objectFit: 'cover'}}
                              priority={index === 0}
                              data-ai-hint={image['data-ai-hint']}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
            
            <LiveClassTimer />

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {dashboardGridItems.map((item, index) => (
                    <Link href={item.href} key={index}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                <item.icon className="h-8 w-8 text-primary mb-2" />
                                <span className="font-semibold">{item.label}</span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <StudentReviews />
                <EducatorsSection />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>New batches starting soon. Stay tuned!</p>
                </CardContent>
            </Card>
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
