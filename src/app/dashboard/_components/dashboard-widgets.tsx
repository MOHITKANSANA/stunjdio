
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { onSnapshot, doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { Youtube, Facebook, Instagram, Twitter, Linkedin, Link as LinkIcon, Star, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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
        if (!liveClass) return;

        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(liveClass.startTime.toDate()));
        }, 1000);

        return () => clearInterval(interval);
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
    const { toast } = useToast();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event);
            setIsDialogOpen(true); // Show dialog when app is installable
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For repeated visits
        if ((window.navigator as any).standalone === false || !window.matchMedia('(display-mode: standalone)').matches) {
           if (sessionStorage.getItem('installPromptShown') !== 'true') {
               setTimeout(() => {
                   if (installPrompt) setIsDialogOpen(true);
                   sessionStorage.setItem('installPromptShown', 'true');
               }, 3000);
           }
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [installPrompt]);
    

    const handleInstallClick = () => {
        setIsDialogOpen(false);
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                   toast({ title: "Installation Complete!", description: "GoSwamiX has been added to your home screen." });
                }
                setInstallPrompt(null);
            });
        } else {
            toast({variant: 'destructive', title: "Installation not available", description: "Your browser may not support PWA installation, or the app is already installed."});
        }
    };
    
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install GoSwamiX App</DialogTitle>
            <DialogDescription>
              For a better experience, install the GoSwamiX app on your device. It's fast, works offline, and gives you a native app feel.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleInstallClick} className="w-full">Install App</Button>
        </DialogContent>
      </Dialog>
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

export const StudentReviews = () => {
  const [reviews, loading] = useCollection(query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc')));
  const [selectedReview, setSelectedReview] = useState<any>(null);

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <>
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
            {selectedReview && (
                <>
                <DialogHeader>
                    <DialogTitle>Review by {selectedReview.name}</DialogTitle>
                     <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} className={i < selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                    </div>
                </DialogHeader>
                <p className="py-4 text-muted-foreground">{selectedReview.review}</p>
                </>
            )}
        </DialogContent>
      </Dialog>

       <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {reviews?.docs.map((doc) => {
              const review = doc.data();
              return (
                <CarouselItem key={doc.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <Card onClick={() => setSelectedReview(review)} className="cursor-pointer hover:bg-muted">
                      <CardContent className="flex flex-col items-center justify-center p-4 gap-4 text-center">
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
                               <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}/>
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
    </>
  );
}

