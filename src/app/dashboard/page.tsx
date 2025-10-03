


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
        if (isNewUser) return "Welcome to Go Swami Coaching!";
        return `Hello, ${user.displayName || 'Student'}!`;
    }

    const mainDashboardItems = [
      { label: "My Learning", icon: Library, href: "/dashboard/my-learning" },
      { label: "Courses", icon: Book, href: "/dashboard/courses" },
      { label: "Live Classes", icon: Clapperboard, href: "/dashboard/live-classes" },
      { label: "AI Tests", icon: Shield, href: "/dashboard/tests" },
    ];


    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mainDashboardItems.map((item, index) => (
                    <Link href={item.href} key={index}>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <item.icon className="h-8 w-8 text-primary mb-2" />
                                <span className="font-semibold text-center">{item.label}</span>
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
