

'use client';
import React, { useState } from 'react';
import {
  Book,
  Library,
  Clapperboard,
  ShieldQuestion,
  Award,
  HelpCircle,
  User,
  BookCopy,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { LiveClassTimer, TopStudentsSection, InstallPwaPrompt, SocialMediaLinks, StudentReviews } from './_components/dashboard-widgets';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

const quickAccessItems = [
  { label: "Courses", icon: Book, href: "/dashboard/courses", color: "from-blue-500 to-sky-500" },
  { label: "Free Courses", icon: BookCopy, href: "/dashboard/courses/free", color: "from-green-500 to-teal-500" },
  { label: "AI Tutor", icon: Bot, href: "/dashboard/tutor", color: "from-cyan-500 to-teal-500" },
  { label: "AI Tests", icon: ShieldQuestion, href: "/dashboard/tests", color: "from-purple-500 to-violet-500" },
  { label: "My Library", icon: Library, href: "/dashboard/my-learning", color: "from-fuchsia-500 to-pink-500" },
  { label: "Live Classes", icon: Clapperboard, href: "/dashboard/live-classes", color: "from-red-500 to-rose-500" },
  { label: "Doubts", icon: HelpCircle, href: "/dashboard/my-learning?tab=notifications", color: "from-orange-500 to-amber-500" },
  { label: "Scholarship", icon: Award, href: "/dashboard/scholarship", color: "from-yellow-500 to-lime-500" },
  { label: "Profile", icon: User, href: "/dashboard/profile", color: "from-slate-500 to-gray-500" },
];

const MainDashboard = () => {
    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handlePress = (label: string) => {
        setActiveButton(label);
        setTimeout(() => setActiveButton(null), 200);
    };

    return (
       <div className="relative min-h-screen w-full">
            <div className="fixed top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-blue-700 to-sky-500 -z-10" 
                 style={{clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'}}
            />
            <div className="relative p-4 md:p-6 space-y-8 z-10">
                <InstallPwaPrompt />

                <div>
                    <h2 className="text-lg font-semibold mb-3 px-4 text-foreground/80">Quick Access</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {quickAccessItems.map(item => (
                            <Link href={item.href} key={item.label} onClick={() => handlePress(item.label)}>
                                <Card className={cn(
                                    "h-full transition-all duration-200 ease-in-out transform hover:-translate-y-1",
                                    "bg-gradient-to-br text-white shadow-lg",
                                    activeButton === item.label ? 'ring-2 ring-offset-2 ring-primary' : '',
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
                </div>

                <LiveClassTimer />
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
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-12 w-12 animate-pulse text-primary" />
                </div>
            </div>
        )
    }

    return <MainDashboard />;
}

    

    
