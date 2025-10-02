

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

const ReviewCard = ({ review, onReviewClick }: { review: any, onReviewClick: (review: any) => void }) => {
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "S";
        return name.charAt(0).toUpperCase();
    }

    return (
        <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
            <Card className="bg-muted/50 h-full cursor-pointer hover:bg-muted/80" onClick={() => onReviewClick(review)}>
                 <CardContent className="p-4 flex flex-col h-full gap-3">
                    <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10 border-2 border-primary">
                            <AvatarImage src={review.userPhoto} />
                            <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{review.userName}</p>
                            <p className="text-xs text-muted-foreground">Student</p>
                        </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 flex-grow">
                        <span className="text-2xl font-bold text-primary/50 mr-1 leading-none">“</span>
                        {review.text}
                    </p>
                </CardContent>
            </Card>
        </CarouselItem>
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
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    
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
                replies: [],
            });
            setNewReview("");
            setIsReviewModalOpen(false);
            toast({ description: "Your review has been submitted. Thank you!" });
        } catch (error: any) {
            toast({ variant: 'destructive', description: `Could not submit your review: ${'' + error.message}` });
        }
    };
        
    const topGridItems = [
      { label: "My Learning", icon: Library, href: "/dashboard/my-learning", color: "from-blue-500 to-indigo-600" },
      { label: "All Courses", icon: Book, href: "/dashboard/courses", color: "from-green-500 to-emerald-600" },
      { label: "Live Classes", icon: Clapperboard, href: "/dashboard/classes-lectures", color: "from-red-500 to-rose-600" },
      { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers", color: "from-purple-500 to-violet-600" },
      { label: "Scholarship", icon: Award, href: "/dashboard/scholarship", color: "from-yellow-500 to-amber-600" },
      { label: "AI Tests", icon: Youtube, href: "/dashboard/ai-test", color: "from-orange-500 to-amber-600" },
    ];
    
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "S";
        return name.charAt(0).toUpperCase();
    }
    
    const getGreeting = () => {
        if (!user) return "Welcome to Go Swami X!";
        
        const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;

        if (isNewUser) {
             return "Welcome to Go Swami X!";
        }

        return `Hello, ${user.displayName || 'Student'}!`;
    }

    return (
        <div className="flex flex-col h-full bg-background space-y-6">
             <Dialog open={!!selectedReview} onOpenChange={(isOpen) => !isOpen && setSelectedReview(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Student Review</DialogTitle>
                        {selectedReview && (
                            <DialogDescription>
                                By {selectedReview.userName}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto">
                        <p>{selectedReview?.text}</p>
                    </div>
                </DialogContent>
            </Dialog>

             <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave a Review</DialogTitle>
                        <DialogDescription>Share your experience with us.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReviewSubmit} className="flex flex-col items-start gap-3">
                        <Textarea 
                            value={newReview} 
                            onChange={(e) => setNewReview(e.target.value)} 
                            placeholder="Write your review here..."
                            className="h-32"
                        />
                        <Button type="submit" size="sm"><Send className="mr-2 h-4 w-4"/>Submit Review</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            
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
                 <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {loadingReviews ? (
                            [...Array(3)].map((_, i) => (
                                <CarouselItem key={i} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                    <Skeleton className="h-40 w-full rounded-lg" />
                                </CarouselItem>
                            ))
                        ) : (
                            reviews.map((review) => <ReviewCard key={review.id} review={review} onReviewClick={setSelectedReview} />)
                        )}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
                <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={() => setIsReviewModalOpen(true)}>
                        <PenSquare className="mr-2 h-4 w-4" />
                        Leave your own review
                    </Button>
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
