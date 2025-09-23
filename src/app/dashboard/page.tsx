

"use client";
import React, { useEffect, useState } from 'react';
import {
  Wallet,
  FileText,
  Globe,
  Puzzle,
  BookOpen,
  Video,
  Award,
  Newspaper,
  BookCopy,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


// Main App Dashboard Component
const MainDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
        
    const quickAccessItems = [
      { label: "Paid Courses", icon: Wallet, href: "/dashboard/courses"},
      { label: "Free Courses", icon: BookOpen, href: "/dashboard/courses/free"},
      { label: "Live Class", icon: Video, href: "/dashboard/live-class"},
      { label: "Test Series", icon: BookCopy, href: "/dashboard/ai-test?tab=series" },
      { label: "AI Tests", icon: Award, href: "/dashboard/ai-test?tab=ai" },
      { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers" },
      { label: "Current Affairs", icon: Globe, href: "#" },
      { label: "Quiz & Games", icon: Puzzle, href: "#"},
      { label: "Scholarship", icon: Award, href: "/dashboard/scholarship" },
    ];
    
    return (
        <div className="flex flex-col h-full bg-background space-y-6">
            <div className="text-left">
                <h2 className="text-2xl font-bold text-foreground">Hello, {user?.displayName || 'Student'}!</h2>
                <p className="text-muted-foreground">{t('motivational_line')}</p>
            </div>

            <div>
                <h2 className="text-lg font-bold mb-3">Quick Access</h2>
                <div className="grid grid-cols-3 gap-4">
                {quickAccessItems.map((item) => (
                    <Link href={item.href} key={item.label}>
                    <Card className="transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl bg-card rounded-xl aspect-square">
                        <CardContent className="flex flex-col items-center justify-center gap-2 p-2 text-center h-full">
                        <div className="p-3 bg-primary/20 text-primary rounded-full">
                            <item.icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-medium text-center text-card-foreground">{item.label}</span>
                        </CardContent>
                    </Card>
                    </Link>
                ))}
                </div>
            </div>
        </div>
    );
};

// Kids Tube Dashboard Component
const KidsTubeDashboard = () => {
    const [videos, loading, error] = useCollection(
        query(collection(firestore, 'kidsTubeVideos'), orderBy('createdAt', 'desc'))
    );
    
    if (loading) return <div><Skeleton className="w-full aspect-video rounded-lg mb-4" /><Skeleton className="h-8 w-3/4 mb-4" /><Skeleton className="h-40 w-full" /></div>
    if (error) return <p className="text-destructive">Error loading videos.</p>
    if (!videos || videos.empty) return <p>No videos available right now. Check back soon!</p>

    return (
        <div className="flex flex-col h-full space-y-4">
             <h1 className="text-2xl font-bold">Kids Tube</h1>
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.docs.map(doc => {
                    const video = doc.data();
                    return (
                        <Link href={`/dashboard/kids/video/${doc.id}`} key={doc.id} className="flex flex-col gap-2 cursor-pointer group">
                           <div className="relative w-full aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
                               <Image src={video.thumbnailUrl || `https://picsum.photos/seed/${doc.id}/300/180`} alt={video.title} fill style={{objectFit: "cover"}} />
                           </div>
                           <div>
                               <h3 className="font-semibold line-clamp-2 group-hover:text-primary">{video.title}</h3>
                               <p className="text-sm text-muted-foreground line-clamp-1">{video.description || "Fun learning video"}</p>
                           </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}


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
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        )
    }

    return isKidsMode ? <KidsTubeDashboard /> : <MainDashboard />;
}
