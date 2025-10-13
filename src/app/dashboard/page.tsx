
'use client';
import React, { useState, useEffect } from 'react';
import {
  Book,
  Library,
  Clapperboard,
  ShieldQuestion,
  Award,
  HelpCircle,
  User,
  BookCopy,
  Bot,
  Users,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { LiveClassTimer, TopStudentsSection, InstallPwaPrompt, SocialMediaLinks, StudentReviews, DashboardMarquee } from './_components/dashboard-widgets';
import { doc, getDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"


const quickAccessItems = [
  { label: "Courses", icon: Book, href: "/dashboard/courses", color: "from-blue-500 to-sky-500" },
  { label: "Free Courses", icon: BookCopy, href: "/dashboard/courses/free", color: "from-green-500 to-teal-500" },
  { label: "AI Tutor", icon: Bot, href: "/dashboard/tutor", color: "from-cyan-500 to-teal-500" },
  { label: "AI Tests", icon: ShieldQuestion, href: "/dashboard/tests", color: "from-purple-500 to-violet-500" },
  { label: "My Library", icon: Library, href: "/dashboard/my-learning", color: "from-fuchsia-500 to-pink-500" },
  { label: "Live Classes", icon: Clapperboard, href: "/dashboard/live-classes", color: "from-red-500 to-rose-500" },
  { label: "Why Us", icon: Info, href: "/p/why-us", color: "from-orange-500 to-amber-500" },
  { label: "Scholarship", icon: Award, href: "/dashboard/scholarship", color: "from-yellow-500 to-lime-500" },
  { label: "Profile", icon: User, href: "/dashboard/profile", color: "from-slate-500 to-gray-500" },
];

const OurEducators = () => {
    const [educators, loading] = useCollection(query(collection(firestore, 'educators'), orderBy('createdAt', 'desc')));
    const plugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true })
    )

    if (loading) return null;
    if (!educators || educators.empty) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground/80 px-4">Our Educators</h2>
            <Carousel
                opts={{ align: "start", loop: true, }}
                plugins={[plugin.current]}
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
                className="w-full"
            >
                <CarouselContent className="-ml-2">
                    {educators.docs.map(doc => {
                        const educator = doc.data();
                        return (
                             <CarouselItem key={doc.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2">
                                <div className="p-1">
                                    <Card className="text-center overflow-hidden">
                                        <CardContent className="p-4 flex flex-col items-center">
                                            <div className="relative h-24 w-24 mx-auto rounded-full overflow-hidden mb-3">
                                                <Image src={educator.photoUrl} alt={educator.name} fill style={{objectFit:"cover"}} />
                                            </div>
                                            <h3 className="font-semibold text-sm">{educator.name}</h3>
                                            <p className="text-xs text-muted-foreground">{educator.expertise}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>
    )
}

const MainDashboard = () => {
    const { user } = useAuth();
    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handlePress = (label: string) => {
        setActiveButton(label);
        setTimeout(() => setActiveButton(null), 300);
    };

    return (
       <div className="relative min-h-screen w-full">
            <div 
                 className="fixed top-0 left-0 right-0 h-[35vh] bg-gradient-to-b from-blue-700 to-sky-500 -z-10" 
                 style={{clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'}}
            />
            <div className="relative p-4 md:p-6 space-y-6 z-10">
                <div className="px-4 text-white">
                    <h1 className="text-2xl font-bold">Hello, {user?.displayName || 'Student'}!</h1>
                </div>

                <InstallPwaPrompt />
                <DashboardMarquee />
                
                <div className="grid grid-cols-3 gap-3">
                    {quickAccessItems.map(item => (
                        <Link href={item.href} key={item.label} onClick={() => handlePress(item.label)}>
                            <Card className={cn(
                                "h-full transition-all duration-200 ease-in-out transform hover:-translate-y-1",
                                "bg-gradient-to-br text-white shadow-lg",
                                activeButton === item.label ? 'ring-2 ring-offset-2 ring-white' : '',
                                item.color
                            )}>
                                <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-2 h-28">
                                    <item.icon className="h-7 w-7" />
                                    <span className="text-xs font-semibold">{item.label}</span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <LiveClassTimer />
                <OurEducators />
                <StudentReviews />
                <TopStudentsSection />
                <SocialMediaLinks />
            </div>
        </div>
    );
};


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [isKidsMode, setIsKidsMode] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const checkUserProfile = async () => {
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setIsKidsMode(userData.ageGroup === '1-9');
                } else {
                    setIsKidsMode(false);
                }
            }
        };

        if (!authLoading) {
            checkUserProfile();
        }
    }, [user, authLoading]);

    if (authLoading || isKidsMode === null) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return <MainDashboard />;
}
