
"use client";
import React from 'react';
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
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';


export default function DashboardPage() {
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
                        <Image src={item.data().imageUrl} alt={item.data().title || "Carousel Image"} layout="fill" objectFit="cover" data-ai-hint="advertisement" />
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
}
