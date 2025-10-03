

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
  Shield,
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
  DialogDescription
} from '@/components/ui/dialog';
import Image from 'next/image';

const carouselImages = [
    { src: 'https://picsum.photos/seed/promo1/1200/600', alt: 'Promotion 1', 'data-ai-hint': 'study class' },
    { src: 'https://picsum.photos/seed/promo2/1200/600', alt: 'Promotion 2', 'data-ai-hint': 'teacher lecture' },
    { src: 'https://picsum.photos/seed/promo3/1200/600', alt: 'Promotion 3', 'data-ai-hint': 'students writing' },
];

const dashboardGridItems: { label: string; icon: React.ElementType; href: string }[] = [
  { label: "My Learning", icon: Library, href: "/dashboard/my-learning" },
  { label: "Courses", icon: Book, href: "/dashboard/courses" },
  { label: "Live Classes", icon: Clapperboard, href: "/dashboard/live-classes" },
  { label: "AI Tests", icon: Shield, href: "/dashboard/tests" },
  { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers" },
  { label: "Scholarship", icon: Award, href: "/dashboard/scholarship" },
];

const MainDashboard = () => {
    const { user } = useAuth();
    
    const getGreeting = () => {
        if (!user) return "Welcome!";
        const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
        if (isNewUser) return "Welcome to Go Swami Coaching!";
        return `Hello, ${user.displayName || 'Student'}!`;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            
            <Carousel 
                opts={{ loop: true }} 
                plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
                className="w-full"
            >
                <CarouselContent>
                  {carouselImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="aspect-w-16 aspect-h-9">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              style={{objectFit: 'cover'}}
                              priority={index === 0}
                              data-ai-hint={image['data-ai-hint']}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {dashboardGridItems.map((item, index) => (
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
