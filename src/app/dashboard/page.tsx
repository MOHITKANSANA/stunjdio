

'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Globe,
  Loader2,
  CheckCircle,
  X,
  Check,
  Bot,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, arrayUnion, where, getDocs } from 'firebase/firestore';
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
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useCollection } from 'react-firebase-hooks/firestore';

const mainGridItems = [
  { label: "My Learning", icon: Library, href: "/dashboard/my-learning", color: "from-blue-500 to-indigo-600" },
  { label: "Live Classes", icon: Clapperboard, href: "/dashboard/live-classes", color: "from-purple-500 to-violet-600" },
  { label: "Test Hub", icon: Shield, href: "/dashboard/tests", color: "from-green-500 to-emerald-600" },
  { label: "AI Tutor", icon: Bot, href: "/dashboard/tutor", color: "from-red-500 to-rose-600" },
  { label: "Scholarship", icon: Award, href: "/dashboard/scholarship", color: "from-yellow-500 to-amber-600" },
  { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers", color: "from-pink-500 to-rose-500" },
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
                <div className="text-2xl font-bold text-primary">{timeLeft}</div>
            </CardContent>
            </Link>
        </Card>
    );
};

const StudentReviews = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [reviews, loading] = useCollection(
        query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc'))
    );
    
    const handleReviewSubmit = async () => {
        if (!user || !reviewText.trim()) {
            toast({ variant: 'destructive', description: "Please write a review before submitting." });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'reviews'), {
                name: user.displayName || 'Anonymous',
                text: reviewText,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Success!", description: "Your review has been submitted." });
            setReviewText('');
            setIsDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not submit your review." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>Share your experience with us.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea 
                        placeholder="Write your review here..." 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                    />
                    <Button onClick={handleReviewSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        
        <Card>
            <CardHeader>
                <CardTitle>What Our Students Say</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-24 w-full" /> : (
                    <Carousel 
                        opts={{ align: "start", loop: true }}
                        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
                        className="w-full"
                    >
                        <CarouselContent>
                            {reviews?.docs.map(doc => {
                                const review = doc.data();
                                return (
                                    <CarouselItem key={doc.id} className="md:basis-1/2 lg:basis-1/3">
                                        <Card>
                                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                                <p className="italic line-clamp-4">"{review.text}"</p>
                                                <p className="font-semibold mt-2 text-right">- {review.name}</p>
                                            </CardContent>
                                        </Card>
                                    </CarouselItem>
                                )
                            })}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                )}
                 <Button variant="outline" className="w-full mt-4" onClick={() => setIsDialogOpen(true)}>
                    Leave Your Review
                 </Button>
            </CardContent>
        </Card>
        </>
    )
};

const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

const intToRGB = (i: number) => {
    const c = (i & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
}

const TopStudentsSection = () => {
    const [usersCollection, usersLoading] = useCollection(
        query(collection(firestore, 'users'), limit(10))
    );
    
    return (
        <Card>
            <CardHeader><CardTitle>Top 10 Students of the Week</CardTitle></CardHeader>
            <CardContent>
                {usersLoading && <Skeleton className="h-24 w-full" />}
                 <div className="flex space-x-6 overflow-x-auto pb-2">
                    {usersCollection?.docs.map((userDoc, i) => {
                        const student = userDoc.data();
                        const avatarColor = `#${intToRGB(hashCode(student.displayName || 'U'))}`;
                        return (
                            <div key={userDoc.id} className="text-center flex-shrink-0 w-24">
                                <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-yellow-400">
                                    <AvatarImage src={student.photoURL} />
                                    <AvatarFallback style={{ backgroundColor: avatarColor }} className="text-2xl font-bold">{student.displayName?.charAt(0) || 'S'}</AvatarFallback>
                                </Avatar>
                                <Badge variant="secondary" className="text-sm bg-yellow-400 text-black">{i+1}</Badge>
                                <p className="text-sm font-medium mt-1 truncate">{student.displayName}</p>
                            </div>
                        )
                    })}
                    {!usersLoading && usersCollection?.empty && <p className="text-muted-foreground">No students found.</p>}
                 </div>
            </CardContent>
        </Card>
    )
}

const EducatorsSection = () => {
    const [educators, loading] = useCollection(
        query(collection(firestore, 'educators'), orderBy('createdAt', 'desc'))
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEducator, setSelectedEducator] = useState<any>(null);

    const openEducatorDetails = (educator: any) => {
        setSelectedEducator(educator);
        setIsDialogOpen(true);
    };

    return (
        <>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                {selectedEducator && (
                    <>
                    <DialogHeader>
                        <DialogTitle>{selectedEducator.name}</DialogTitle>
                        <DialogDescription>{selectedEducator.expertise}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 flex justify-center">
                        <Avatar className="h-40 w-40">
                            <AvatarImage src={selectedEducator.photoUrl} alt={selectedEducator.name} />
                            <AvatarFallback className="text-4xl">{selectedEducator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    </>
                )}
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
        <Card>
            <CardHeader><CardTitle>Meet Our Educators</CardTitle></CardHeader>
            <CardContent>
                {loading && <Skeleton className="h-24 w-full" />}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {educators?.docs.map(doc => {
                        const educator = doc.data();
                        return (
                             <div key={doc.id} className="text-center cursor-pointer" onClick={() => openEducatorDetails(educator)}>
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
        </>
    )
}

const MainDashboard = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<any>(null);
    
    useEffect(() => {
      const unsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
        if (doc.exists()) {
          setSettings(doc.data());
        }
      });
      return () => unsub();
    }, []);

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

            {settings?.carouselImages ? (
              <Carousel 
                opts={{ loop: true }} 
                plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
                className="w-full"
              >
                <CarouselContent>
                  {settings.carouselImages.map((url: string, index: number) => (
                    <CarouselItem key={index}>
                      <Card className="overflow-hidden">
                         <CardContent className="p-0 aspect-video relative">
                            <Image
                              src={url}
                              alt={`Carousel Image ${index + 1}`}
                              fill
                              className="object-cover"
                              priority={index === 0}
                            />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
            ) : <Skeleton className="h-48 w-full" />}
            
            <div className="grid grid-cols-3 gap-3">
                {mainGridItems.map(item => (
                    <Link href={item.href} key={item.label}>
                        <Card className={cn("text-white h-full hover:opacity-90 transition-opacity bg-gradient-to-br", item.color)}>
                             <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-1 h-24">
                                <item.icon className="h-7 w-7" />
                                <span className="text-xs font-semibold">{item.label}</span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
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
