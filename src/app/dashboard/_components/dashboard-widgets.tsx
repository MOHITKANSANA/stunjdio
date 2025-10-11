
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { onSnapshot, doc, collection, query, orderBy, limit, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { Youtube, Facebook, Instagram, Twitter, Linkedin, Link as LinkIcon, Star, CheckCircle, Download, X, Volume2, Loader2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';
import { getAudioAction } from '@/app/actions/ai-tutor';

export const LiveClassTimer = () => {
    const [liveClass, setLiveClass] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<any>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [loading, setLoading] = useState(true);

    const calculateTimeLeft = useCallback((targetDate?: Date) => {
        if (!targetDate) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        const difference = +targetDate - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }, []);

    useEffect(() => {
        const q = query(collection(firestore, 'live_classes'), where('startTime', '>', new Date()), orderBy('startTime', 'asc'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setLiveClass({ id: doc.id, ...doc.data() });
            } else {
                setLiveClass(null);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (liveClass?.startTime) {
            const interval = setInterval(() => {
                setTimeLeft(calculateTimeLeft(liveClass.startTime.toDate()));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [liveClass, calculateTimeLeft]);

    if (loading) {
        return <Skeleton className="h-24 w-full rounded-lg" />
    }

    return (
        <Card className="bg-white/10 backdrop-blur-sm text-white border-white/20 shadow-lg">
           <Link href={liveClass ? `/dashboard/live-class/${liveClass.id}`: '#'}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                 <p className="font-semibold text-sm opacity-90">Next Live Class</p>
                 <div className="flex items-center gap-2 my-2">
                    {Object.entries(timeLeft).map(([unit, value]: [string, unknown]) => (
                        <div key={unit} className="flex flex-col items-center">
                            <span className="text-2xl font-bold">{String(value).padStart(2, '0')}</span>
                            <span className="text-xs opacity-80">{unit}</span>
                        </div>
                    ))}
                 </div>
                 <p className="text-xs font-medium truncate max-w-full">{liveClass ? liveClass.title : 'No Upcoming Classes'}</p>
            </CardContent>
           </Link>
        </Card>
    );
};

export const TopStudentsSection = () => {
    const [usersCollection, usersLoading] = useCollection(collection(firestore, 'users'));
    const [topStudents, setTopStudents] = useState<any[]>([]);

    useEffect(() => {
        const unsub = onSnapshot(doc(firestore, 'settings', 'topStudents'), (doc) => {
            if (doc.exists() && usersCollection) {
                const topStudentUids = doc.data().uids || [];
                const userMap = new Map(usersCollection.docs.map(d => [d.id, {id: d.id, ...d.data()}]));
                const studentDetails = topStudentUids.map((uid: string) => userMap.get(uid)).filter(Boolean);
                setTopStudents(studentDetails);
            }
        });
        return () => unsub();
    }, [usersCollection]);
    
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground/80 px-4">Top 10 Students</h2>
            {usersLoading ? <Skeleton className="h-24 w-full" /> : (
                <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4">
                    {topStudents.length > 0 ? topStudents.map((student, i) => (
                        <div key={student.id} className="text-center flex-shrink-0 w-20">
                            <Avatar className="h-16 w-16 mx-auto mb-1 border-2 border-primary/50">
                                <AvatarImage src={student.photoURL} />
                                <AvatarFallback>{student.displayName?.charAt(0) || 'S'}</AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium mt-1 truncate">{student.displayName}</p>
                            <Badge variant="secondary" className="mt-1">Rank {i+1}</Badge>
                        </div>
                    )) : <p className="text-muted-foreground text-sm text-center w-full">No top students this week.</p>}
                </div>
            )}
        </div>
    )
}

export const InstallPwaPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event);
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                   setIsVisible(false);
                }
            });
        }
    };
    
    if(!isVisible) return null;

    return (
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg">
          <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                  <Download className="h-8 w-8" />
                  <div>
                      <h3 className="font-bold">Install the Learn with Munedra App</h3>
                      <p className="text-sm opacity-90">For a better, faster, and offline-ready experience.</p>
                  </div>
              </div>
              <Button onClick={handleInstallClick} className="bg-white text-purple-600 hover:bg-gray-100 shrink-0">Install Now</Button>
          </CardContent>
      </Card>
    )
}


export const SocialMediaLinks = () => {
    const [socialLinks, loading] = useDocumentData(doc(firestore, 'settings', 'appConfig'));

    const SocialIcon = ({ name }: { name: string }) => {
        switch (name.toLowerCase()) {
            case 'youtube': return <Youtube />;
            case 'facebook': return <Facebook />;
            case 'instagram': return <Instagram />;
            case 'twitter': return <Twitter />;
            case 'linkedin': return <Linkedin />;
            default: return <LinkIcon />;
        }
    }

    if (loading) return <Skeleton className="h-24 w-full" />;
    if (!socialLinks?.socialMediaLinks || socialLinks.socialMediaLinks.length === 0) return null;

    return (
        <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-foreground/80">Join Our Social Media</h2>
             <div className="flex justify-center items-center gap-4">
                {socialLinks.socialMediaLinks.map((link: any) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="rounded-full h-12 w-12">
                            <SocialIcon name={link.icon} />
                        </Button>
                    </a>
                ))}
            </div>
        </div>
    )
}

const LeaveReviewDialog = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
        toast({ variant: 'destructive', description: "You must be logged in to leave a review." });
        return;
    }
    if (rating === 0) {
        toast({ variant: 'destructive', description: "Please select a star rating." });
        return;
    }
     if (review.trim() === '') {
        toast({ variant: 'destructive', description: "Please write a review." });
        return;
    }
    setIsSubmitting(true);
    try {
        await addDoc(collection(firestore, 'reviews'), {
            userId: user.uid,
            name: user.displayName,
            photoURL: user.photoURL,
            rating,
            review,
            createdAt: serverTimestamp(),
        });
        toast({ description: "Thank you for your review!" });
        onOpenChange(false);
    } catch(e) {
        toast({ variant: 'destructive', description: "Could not submit your review." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>Share your experience with us.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="flex justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn('h-8 w-8 cursor-pointer transition-colors', i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300')}
                        onClick={() => setRating(i + 1)}
                    />
                ))}
            </div>
            <Textarea 
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us what you think..."
                rows={4}
            />
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const StudentReviews = () => {
  const [reviews, loading] = useCollection(query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc')));
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const handlePlayAudio = async (text: string) => {
    if (!text || !audioRef.current) return;
    setIsAudioLoading(true);
    audioRef.current.pause();
    audioRef.current.src = "";
    try {
        const audioResult = await getAudioAction(text);
        if (audioRef.current) {
            audioRef.current.src = audioResult.media;
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
    } catch (error) {
        console.error("Error generating audio:", error);
    } finally {
        setIsAudioLoading(false);
    }
  }

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      {showReviewForm && <LeaveReviewDialog onOpenChange={setShowReviewForm} />}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
            {selectedReview && (
                <>
                <DialogHeader>
                    <DialogTitle>Review by {selectedReview.name}</DialogTitle>
                     <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} className={cn("h-5 w-5", i < selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                        ))}
                    </div>
                </DialogHeader>
                <p className="py-4 text-muted-foreground">{selectedReview.review}</p>
                 <Button variant="outline" onClick={() => handlePlayAudio(selectedReview.review)} disabled={isAudioLoading}>
                    {isAudioLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                    <span className="ml-2">Read Aloud</span>
                </Button>
                </>
            )}
        </DialogContent>
      </Dialog>
       
       <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground/80 px-4">What Our Students Say</h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {reviews?.docs.map((doc) => {
              const review = doc.data();
              return (
                <CarouselItem key={doc.id} className="basis-full md:basis-1/2 lg:basis-1/3 pl-2">
                  <div className="p-1">
                    <Card onClick={() => setSelectedReview(review)} className="cursor-pointer hover:bg-muted">
                      <CardContent className="flex flex-col items-center justify-center p-4 gap-4 text-center h-48">
                         <Avatar className="h-16 w-16">
                            <AvatarImage src={review.photoURL} />
                            <AvatarFallback>{review.name?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        <div>
                             <p className="font-semibold">{review.name}</p>
                             <p className="text-xs text-muted-foreground line-clamp-2">{review.review}</p>
                        </div>
                         <div className="flex items-center gap-1">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={cn("h-4 w-4", i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
        <div className="px-4">
            <Button variant="outline" className="w-full" onClick={() => setShowReviewForm(true)}>Leave Your Review</Button>
        </div>
      </div>
    </>
  );
}


export const DashboardMarquee = () => {
    const [promotions, loading, error] = useCollection(
        query(collection(firestore, 'promotions'), orderBy('createdAt', 'desc'))
    );

    if (loading || error || !promotions || promotions.empty) {
        return null; // Don't render anything if there's nothing to show
    }

    return (
        <div className="relative flex overflow-x-hidden bg-primary text-primary-foreground rounded-lg shadow-md">
            <div className="py-2 animate-marquee whitespace-nowrap">
                {promotions.docs.map(doc => (
                    <a href={doc.data().url} target="_blank" rel="noopener noreferrer" key={doc.id} className="mx-8 text-sm font-semibold hover:underline">
                        <Megaphone className="inline-block mr-2 h-4 w-4" />
                        {doc.data().title}
                    </a>
                ))}
            </div>
             <div className="absolute top-0 py-2 animate-marquee whitespace-nowrap">
                 {promotions.docs.map(doc => (
                    <a href={doc.data().url} target="_blank" rel="noopener noreferrer" key={doc.id} className="mx-8 text-sm font-semibold hover:underline">
                        <Megaphone className="inline-block mr-2 h-4 w-4" />
                        {doc.data().title}
                    </a>
                ))}
            </div>
        </div>
    );
}
