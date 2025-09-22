
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Image from 'next/image';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { ThumbsUp, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Main App Dashboard Component
const MainDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const [carouselItems, loading] = useCollection(
        query(collection(firestore, 'homepageCarousel'), orderBy('createdAt', 'asc'))
    );
    
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

            <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                {loading && <CarouselItem><Skeleton className="w-full h-48 rounded-lg" /></CarouselItem>}
                {carouselItems?.docs.map((item) => (
                    <CarouselItem key={item.id}>
                        <Link href={item.data().linkUrl || "#"}>
                            <div className="relative h-48 w-full rounded-lg overflow-hidden">
                                <Image src={item.data().imageUrl} alt={item.data().title || "Carousel Image"} fill style={{objectFit: "cover"}} data-ai-hint="advertisement" />
                            </div>
                        </Link>
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
            </Carousel>

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
    const [selectedVideo, setSelectedVideo] = useState<any>(null);

    const getYoutubeVideoId = (url: string): string | null => {
      if (!url) return null;
      let videoId: string | null = null;
      try {
          const patterns = [
              /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
              /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
          ];
          for (const pattern of patterns) {
              const match = url.match(pattern);
              if (match && match[1]) {
                  videoId = match[1];
                  break;
              }
          }
      } catch (e) { console.error("Error parsing YouTube URL", e); return null; }
      return videoId;
    }

    useEffect(() => {
        if (videos && !videos.empty && !selectedVideo) {
            setSelectedVideo(videos.docs[0].data());
        }
    }, [videos, selectedVideo]);
    
    if (loading) return <div><Skeleton className="w-full aspect-video rounded-lg mb-4" /><Skeleton className="h-8 w-3/4 mb-4" /><Skeleton className="h-40 w-full" /></div>
    if (error) return <p className="text-destructive">Error loading videos.</p>
    if (!videos || videos.empty) return <p>No videos available right now. Check back soon!</p>

    return (
        <div className="flex flex-col h-full">
            {selectedVideo && (
                <div className="sticky top-0 z-10 bg-background pb-4">
                    <div className="aspect-video w-full rounded-lg overflow-hidden mb-4 bg-black">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedVideo.videoUrl)}?autoplay=1`}
                            title={selectedVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <Button variant="outline" size="sm"><ThumbsUp className="mr-2"/> Like</Button>
                        <Button variant="outline" size="sm"><MessageCircleQuestion className="mr-2"/> Ask Doubt</Button>
                    </div>
                </div>
            )}
            <div className="flex-grow space-y-4 pt-4">
                {videos.docs.map(doc => {
                    const video = doc.data();
                    const videoId = getYoutubeVideoId(video.videoUrl);
                    if (!videoId) return null;
                    return (
                        <div key={doc.id} className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedVideo(video)}>
                           <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                               <Image src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt={video.title} fill style={{objectFit: "cover"}} />
                           </div>
                           <div>
                               <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                               <p className="text-sm text-muted-foreground line-clamp-1">{video.description}</p>
                           </div>
                        </div>
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
