

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
import Image from 'next/image';

const MainDashboard = () => {
    const { user } = useAuth();
    
    const getGreeting = () => {
        if (!user) return "Welcome!";
        const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
        if (isNewUser) return "Welcome to MindSphere!";
        return `Hello, ${user.displayName || 'Student'}!`;
    }

    const featureCards = [
        { label: "Daily Learning", icon: BookOpen, href: "/dashboard/daily-learning", color: "from-blue-500 to-indigo-600" },
        { label: "Notes & PDFs", icon: Book, href: "/dashboard/my-learning", color: "from-green-500 to-emerald-600" },
        { label: "Video Lectures", icon: Video, href: "/dashboard/courses", color: "from-red-500 to-rose-600" },
        { label: "Motivation", icon: Lightbulb, href: "/dashboard/motivation", color: "from-yellow-500 to-amber-600" },
        { label: "Battle Quiz", icon: Swords, href: "/dashboard/quiz", color: "from-orange-500 to-red-500" },
        { label: "Leaderboard", icon: Trophy, href: "/dashboard/leaderboard", color: "from-purple-500 to-violet-600" },
        { label: "Study Planner", icon: Calendar, href: "/dashboard/planner", color: "from-pink-500 to-rose-500" },
        { label: "Community", icon: Users, href: "/dashboard/community", color: "from-teal-500 to-cyan-600" },
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-primary/10 via-background to-background space-y-6">
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {featureCards.map((item) => (
                    <Link href={item.href} key={item.label}>
                        <Card className={cn("transform-gpu text-white transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl rounded-xl bg-gradient-to-br", item.color)}>
                            <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full aspect-square">
                                <item.icon className="h-8 w-8" />
                                <span className="text-sm font-semibold text-center">{item.label}</span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Placeholder for other sections */}
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
