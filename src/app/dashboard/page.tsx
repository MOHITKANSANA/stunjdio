
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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';


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

const ReviewCard = ({ review }: { review: any }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [replyText, setReplyText] = useState("");
    const [showReplies, setShowReplies] = useState(false);

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !replyText.trim()) return;

        const replyData = {
            id: doc(collection(firestore, 'dummy')).id,
            text: replyText,
            userName: user.displayName,
            userPhoto: user.photoURL,
            createdAt: new Date(),
        };

        try {
            await updateDoc(doc(firestore, 'reviews', review.id), {
                replies: arrayUnion(replyData)
            });
            setReplyText("");
        } catch (error) {
            toast({ variant: 'destructive', description: "Failed to post reply." });
        }
    };
    
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "S";
        return name.charAt(0).toUpperCase();
    }


    return (
        <Card className="bg-muted/50 w-80 shrink-0">
            <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={review.userPhoto} />
                        <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{review.userName}</p>
                        <p className="text-sm">{review.text}</p>
                    </div>
                </div>
                <div className="flex-grow" />
                <div className="mt-4 text-xs space-y-2">
                    <button onClick={() => setShowReplies(!showReplies)} className="text-blue-500 hover:underline">
                        {showReplies ? 'Hide' : `View replies (${review.replies?.length || 0})`}
                    </button>
                    {showReplies && (
                        <div className="space-y-2 pt-2 border-t">
                            {review.replies?.map((reply: any) => (
                                <div key={reply.id} className="flex items-start gap-2">
                                     <Avatar className="h-6 w-6">
                                        <AvatarImage src={reply.userPhoto} />
                                        <AvatarFallback>{getInitials(reply.userName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-xs">{reply.userName}</p>
                                        <p className="text-xs">{reply.text}</p>
                                    </div>
                                </div>
                            ))}
                             <form onSubmit={handleReplySubmit} className="flex items-center gap-2 pt-2">
                                <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply..." className="h-8 text-xs" />
                                <Button type="submit" size="sm" className="h-8">Reply</Button>
                            </form>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
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
    const [carouselItems, setCarouselItems] = useState<any[]>([]);
    const [loadingCarousel, setLoadingCarousel] = useState(true);

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

        const reviewsQuery = query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc'));
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReviews(fetchedReviews);
            setLoadingReviews(false);
        });
        
        const carouselQuery = query(collection(firestore, 'homepageCarousel'), orderBy('createdAt', 'asc'));
        const unsubscribeCarousel = onSnapshot(carouselQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCarouselItems(items);
            setLoadingCarousel(false);
        });

        return () => {
            unsubscribe();
            unsubscribeReviews();
            unsubscribeCarousel();
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
                replies: [],
            });
            setNewReview("");
            toast({ description: "Your review has been submitted. Thank you!" });
        } catch (error: any) {
            toast({ variant: 'destructive', description: `Could not submit your review: ${error.message}` });
        }
    };
        
    const topGridItems = [
      { label: "My Learning", icon: Library, href: "/dashboard/my-learning", color: "from-blue-500 to-indigo-600" },
      { label: "All Courses", icon: Book, href: "/dashboard/courses", color: "from-green-500 to-emerald-600" },
      { label: "Live Classes", icon: Clapperboard, href: "/dashboard/classes-lectures", color: "from-red-500 to-rose-600" },
      { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers", color: "from-purple-500 to-violet-600" },
      { label: "Scholarship", icon: Award, href: "/dashboard/scholarship", color: "from-yellow-500 to-golden-600" },
      { label: "AI Tests", icon: Youtube, href: "/dashboard/ai-test", color: "from-orange-500 to-amber-600" },
    ];
    
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "S";
        return name.charAt(0).toUpperCase();
    }
    
    return (
        <div className="flex flex-col h-full bg-background space-y-6">
            <h1 className="text-2xl font-bold">Hello, {user?.displayName || 'Student'}!</h1>

             <Carousel opts={{ loop: true }} className="w-full">
                <CarouselContent>
                    {loadingCarousel ? (
                         <CarouselItem><Skeleton className="h-48 w-full rounded-lg" /></CarouselItem>
                    ) : (
                        carouselItems.map(item => (
                            <CarouselItem key={item.id}>
                                <Link href={item.linkUrl}>
                                    <div className="relative h-48 w-full rounded-lg overflow-hidden">
                                        <img src={item.imageUrl} alt="Carousel item" className="w-full h-full object-cover" />
                                    </div>
                                </Link>
                            </CarouselItem>
                        ))
                    )}
                </CarouselContent>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
            </Carousel>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                 {topGridItems.map((item) => (
                    <Link href={item.href} key={item.label}>
                        <Card className={cn("transform-gpu text-white transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl rounded-xl bg-gradient-to-br", item.color)}>
                            <CardContent className="flex flex-col items-center justify-center gap-2 p-2 md:p-4 h-full aspect-square">
                                <item.icon className="h-6 w-6 md:h-8 md:w-8" />
                                <span className="text-xs md:text-sm font-semibold text-center">{item.label}</span>
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
                            [...Array(5)].map((_, i) => (
                                <CarouselItem key={i} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5">
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                </CarouselItem>
                            ))
                        ) : (
                             topStudents.map((student) => (
                                <CarouselItem key={student.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5">
                                    <Card className="bg-card border-border/60 overflow-hidden text-center">
                                        <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
                                            <Avatar className="h-12 w-12 border-2 border-primary">
                                                <AvatarImage src={student.photoURL} />
                                                <AvatarFallback>{getInitials(student.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-semibold text-sm truncate w-full">{student.displayName}</p>
                                            <Badge variant="secondary" className="bg-yellow-400 text-black text-xs">Rank #{student.rank}</Badge>
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
                 <div className="relative">
                    <Carousel opts={{ align: "start" }}>
                        <CarouselContent className="-ml-4">
                            {loadingReviews ? <Skeleton className="h-48 w-full" /> : reviews.map((review, index) => (
                                <CarouselItem key={index} className="pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3">
                                   <ReviewCard review={review} />
                                </CarouselItem>
                            ))}
                             <CarouselItem className="pl-4 basis-4/5 sm:basis-1/2 md:basis-1/3">
                                 <Card className="bg-muted/50 w-80 shrink-0 h-full">
                                    <CardContent className="p-4 flex flex-col justify-center h-full">
                                         <h3 className="font-semibold mb-2 text-center">Leave a review</h3>
                                         <form onSubmit={handleReviewSubmit} className="flex flex-col items-start gap-3">
                                            <Textarea 
                                                value={newReview} 
                                                onChange={(e) => setNewReview(e.target.value)} 
                                                placeholder="Write your review here..."
                                                className="h-24"
                                            />
                                            <Button type="submit" size="sm"><Send className="mr-2"/>Submit</Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2"/>
                    </Carousel>
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
