
"use client";
import React, { useEffect, useState } from 'react';
import {
  Book,
  Video,
  Award,
  BookCopy,
  FileText,
  Youtube,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
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
} from "@/components/ui/carousel"
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';


const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
    const calculateTimeLeft = () => {
        const difference = +targetDate - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (+targetDate < +new Date()) return;
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    if (+targetDate < +new Date()) {
        return <div className="text-center text-lg font-bold">Class is Live!</div>;
    }

    return (
        <div className="flex justify-center gap-2 md:gap-4 text-center">
            {Object.entries(timeLeft).map(([interval, value]) => (
                <div key={interval} className="flex flex-col p-2 bg-white/20 rounded-lg w-16">
                    <span className="text-2xl font-bold">{String(value).padStart(2, '0')}</span>
                    <span className="text-xs uppercase text-white/80">{interval}</span>
                </div>
            ))}
        </div>
    );
};

// Main App Dashboard Component
const MainDashboard = () => {
    const { user } = useAuth();
    const [topStudents, setTopStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [nextLiveClass, setNextLiveClass] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [newReview, setNewReview] = useState("");
    const { toast } = useToast();

     useEffect(() => {
        const q = query(
            collection(firestore, 'live_classes'),
            orderBy('startTime', 'asc'),
            limit(1)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setNextLiveClass(snapshot.docs[0].data());
            } else {
                setNextLiveClass(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(collection(firestore, 'users'), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const students = snapshot.docs.map((doc, index) => ({
                id: doc.id,
                rank: index + 1,
                ...doc.data()
            }));
            setTopStudents(students);
            setLoadingStudents(false);
        });

        const reviewsQuery = query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const fetchedReviews = snapshot.docs.map(doc => doc.data());
            setReviews(fetchedReviews);
            setLoadingReviews(false);
        });

        return () => {
            unsubscribe();
            unsubscribeReviews();
        };
    }, []);
    
    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newReview.trim()) return;
        try {
            await addDoc(collection(firestore, 'reviews'), {
                text: newReview,
                userName: user.displayName,
                userPhoto: user.photoURL,
                createdAt: serverTimestamp(),
            });
            setNewReview("");
            toast({ description: "Your review has been submitted. Thank you!" });
        } catch (error: any) {
            toast({ variant: 'destructive', description: `Could not submit your review: ${error.message}` });
        }
    };
        
    const topGridItems = [
      { label: "Free Courses", icon: BookCopy, href: "/dashboard/courses/free", color: "bg-blue-500" },
      { label: "Paid Courses", icon: Book, href: "/dashboard/courses", color: "bg-green-500" },
      { label: "Classes & Lectures", icon: Video, href: "/dashboard/classes-lectures", color: "bg-orange-500" },
      { label: "Classes & Lectures", icon: Youtube, href: "/dashboard/classes-lectures", color: "bg-red-500" },
      { label: "Test Series", icon: FileText, href: "/dashboard/test-series", color: "bg-purple-500" },
      { label: "Scholarship", icon: Award, href: "/dashboard/scholarship", color: "bg-yellow-500" },
    ];
    
    return (
        <div className="flex flex-col h-full bg-background space-y-6">
            <div className="grid grid-cols-3 gap-4">
                 {topGridItems.map((item) => (
                    <Link href={item.href} key={item.label}>
                        <Card className={cn("transform-gpu text-white transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl rounded-xl", item.color)}>
                            <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full aspect-square">
                                <item.icon className="h-8 w-8" />
                                <span className="text-sm font-semibold text-center">{item.label}</span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
            
            <div>
                <h2 className="text-xl font-bold mb-3">Top 10 Students of the Week</h2>
                 <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {loadingStudents ? (
                            [...Array(3)].map((_, i) => (
                                <CarouselItem key={i} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                </CarouselItem>
                            ))
                        ) : (
                             topStudents.map((student, index) => (
                                <CarouselItem key={student.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                                    <Card className="bg-card border-border/60">
                                        <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={student.photoURL} />
                                                <AvatarFallback>{student.displayName?.charAt(0) || 'S'}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-semibold truncate w-full text-center">{student.displayName}</p>
                                            <Badge variant="secondary" className="bg-yellow-400 text-black">Rank #{student.rank}</Badge>
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            ))
                        )}
                    </CarouselContent>
                </Carousel>
            </div>

            {nextLiveClass && nextLiveClass.startTime && (
                <div className="bg-slate-800 rounded-lg p-4 text-white text-center">
                    <h2 className="text-lg font-bold mb-3">Next Live Class Starts in</h2>
                    <CountdownTimer targetDate={nextLiveClass.startTime.toDate()} />
                </div>
            )}
            
            <div>
                 <h2 className="text-xl font-bold mb-3">What Our Students Say</h2>
                 <div className="space-y-4">
                    {loadingReviews ? <Skeleton className="h-24 w-full" /> : reviews.map((review, index) => (
                        <Card key={index} className="bg-muted/50 animate-fade-in">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={review.userPhoto} />
                                        <AvatarFallback>{review.userName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{review.userName}</p>
                                        <p className="text-sm">{review.text}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    <Card>
                        <CardContent className="p-4">
                             <form onSubmit={handleReviewSubmit} className="flex items-start gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user?.photoURL || undefined} />
                                    <AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <Textarea 
                                    value={newReview} 
                                    onChange={(e) => setNewReview(e.target.value)} 
                                    placeholder="Write your review here..." 
                                />
                                <Button type="submit"><Send /></Button>
                            </form>
                        </CardContent>
                    </Card>
                 </div>
            </div>
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
