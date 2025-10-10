

'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Book,
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
  Download,
  Star,
  UserCheck,
  Settings,
  HelpCircle,
  FileSignature,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
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
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';

const quickAccessItems = [
  { label: "Courses", icon: Book, href: "/dashboard/courses", color: "from-blue-500 to-sky-500" },
  { label: "Tests", icon: FileText, href: "/dashboard/tests", color: "from-green-500 to-emerald-500" },
  { label: "My Library", icon: Library, href: "/dashboard/my-learning", color: "from-purple-500 to-violet-500" },
  { label: "Doubts", icon: HelpCircle, href: "/dashboard/my-learning?tab=notifications", color: "from-orange-500 to-amber-500" },
  { label: "Profile", icon: User, href: "/dashboard/profile", color: "from-red-500 to-rose-500" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings", color: "from-slate-500 to-gray-500" },
  { label: "Free Courses", icon: BookCopy, href: "/dashboard/courses/free", color: "from-yellow-500 to-lime-500" },
  { label: "Scholarship", icon: Award, href: "/dashboard/scholarship", color: "from-pink-500 to-fuchsia-500" },
  { label: "AI Tutor", icon: Bot, href: "/dashboard/tutor", color: "from-cyan-500 to-teal-500" },
];


const LiveClassTimer = () => {
    const [liveClass, setLiveClass] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const calculateTimeLeft = useCallback((targetDate: Date) => {
        const difference = +targetDate - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return null;
    }, []);

    useEffect(() => {
        const q = query(collection(firestore, 'live_classes'), where('startTime', '>', new Date()), orderBy('startTime', 'asc'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setLiveClass({ id: doc.id, ...doc.data() });
            } else {
                setLiveClass(null);
                const sampleDate = new Date();
                sampleDate.setDate(sampleDate.getDate() + 2);
                sampleDate.setHours(18, 0, 0, 0);
                setTimeLeft(calculateTimeLeft(sampleDate));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [calculateTimeLeft]);

    useEffect(() => {
        if (!liveClass) return;

        const interval = setInterval(() => {
            const newTimeLeft = calculateTimeLeft(liveClass.startTime.toDate());
            if (newTimeLeft) {
                setTimeLeft(newTimeLeft);
            } else {
                clearInterval(interval);
                setTimeLeft(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [liveClass, calculateTimeLeft]);

    if (loading) {
        return <Skeleton className="h-24 w-full" />
    }

    return (
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg col-span-2">
           <Link href={liveClass ? `/dashboard/live-class/${liveClass.id}`: '#'}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                 <p className="font-semibold text-sm opacity-90">Next Live Class</p>
                 {timeLeft ? (
                    <div className="flex items-center gap-2 my-2">
                        {Object.entries(timeLeft).map(([unit, value]) => (
                            <div key={unit} className="flex flex-col items-center">
                                <span className="text-2xl font-bold">{String(value).padStart(2, '0')}</span>
                                <span className="text-xs opacity-80">{unit}</span>
                            </div>
                        ))}
                    </div>
                 ) : (
                     <p className="font-semibold my-2">No upcoming classes</p>
                 )}
                 <p className="text-xs font-medium truncate max-w-full">{liveClass ? liveClass.title : 'Stay Tuned!'}</p>
            </CardContent>
           </Link>
        </Card>
    );
};

const TopStudentsSection = () => {
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
            {usersLoading ? <Skeleton className="h-16 w-full" /> : (
                <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4">
                    {topStudents.length > 0 ? topStudents.map((student, i) => (
                        <div key={student.id} className="text-center flex-shrink-0 w-20">
                            <Avatar className="h-14 w-14 mx-auto mb-1 border-2 border-primary/50">
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

const InstallPwaPrompt = () => {
    const { toast } = useToast();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    
    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                   toast({ title: "Installation Complete!", description: "GoSwamiX has been added to your home screen." });
                }
                setInstallPrompt(null);
                setShowInstallBanner(false);
            });
        } else {
            toast({variant: 'destructive', title: "Installation not available", description: "Your browser may not support PWA installation, or the app is already installed."});
        }
    };
    
    if(!showInstallBanner) return null;

    return (
        <div className="bg-primary/10 border-b border-primary/20 p-2 text-center text-sm sticky top-0 z-20">
            <p>
                Enhance your experience!{' '}
                <button onClick={handleInstallClick} className="font-bold underline">
                    Install the GoSwamiX App
                </button>
            </p>
        </div>
    )
}

const SocialMediaLinks = () => {
    const [socialLinks, loading] = useDocumentData(doc(firestore, 'settings', 'appConfig'));

    const SocialIcon = ({ name }: { name: string }) => {
        switch (name.toLowerCase()) {
            case 'youtube': return <Youtube />;
            case 'facebook': return <Facebook />;
            case 'instagram': return <Instagram />;
            case 'twitter': return <Twitter />;
            case 'linkedin': return <Linkedin />;
            default: return <Link />;
        }
    }

    if (loading) return <Skeleton className="h-10 w-full" />;
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


const MainDashboard = () => {
    const { user } = useAuth();
    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handlePress = (label: string) => {
        setActiveButton(label);
        setTimeout(() => setActiveButton(null), 200);
    };
    

    return (
       <div className="min-h-screen">
            <InstallPwaPrompt />
            <div className="p-4 md:p-6 space-y-8">
                <div className="relative h-48 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-indigo-600 transform -skew-y-3 origin-top-left"></div>
                </div>

                <div className="-mt-40 space-y-8">
                    <LiveClassTimer />
                    
                    <TopStudentsSection />

                    <div>
                        <h2 className="text-lg font-semibold mb-3 px-4 text-foreground/80">Quick Access</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {quickAccessItems.map(item => (
                                <Link href={item.href} key={item.label} onClick={() => handlePress(item.label)}>
                                    <Card className={cn(
                                        "h-full transition-all duration-200 ease-in-out transform hover:-translate-y-1 bg-background",
                                        activeButton === item.label 
                                            ? 'shadow-lg' 
                                            : 'shadow-md'
                                    )}>
                                        <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-2 h-28">
                                            <div className={cn("p-3 rounded-full bg-gradient-to-br", item.color)}>
                                                <item.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="text-xs font-semibold">{item.label}</span>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                
                 <Card>
                    <CardHeader><CardTitle>What Our Students Say</CardTitle></CardHeader>
                    <CardContent>
                       <Button className="w-full">Leave Your Review</Button>
                    </CardContent>
                </Card>

                <SocialMediaLinks />
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
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    return isKidsMode ? <KidsTubeDashboard /> : <MainDashboard />;
}
