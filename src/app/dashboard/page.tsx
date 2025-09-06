
"use client";
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Video,
  ShieldQuestion,
  Trophy,
  Wallet,
  FileText,
  PlayCircle,
  BookCopy,
  Globe,
  Puzzle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const TopStudentCard = ({ rank, name, avatarUrl }: { rank: number, name: string | null, avatarUrl: string | null }) => (
    <Card className="flex flex-col items-center justify-center p-4 shadow-md h-full">
        <div className="relative mb-2">
            <Avatar className="h-16 w-16 border-2 border-yellow-400">
                <AvatarImage src={avatarUrl || undefined} alt={name || 'Student'} data-ai-hint="student" />
                <AvatarFallback>{name ? name.charAt(0) : 'S'}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                {rank}
            </div>
        </div>
        <p className="font-semibold text-sm mt-2 text-center">{name || 'Student'}</p>
    </Card>
)

const NextLiveClassCard = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    const [nextLiveClass, loading, error] = useCollection(
        query(
            collection(firestore, 'live_classes'), 
            where('startTime', '>', now),
            orderBy('startTime', 'asc'),
            limit(1)
        )
    );

    if (loading) return <Skeleton className="h-24 w-full" />;
    
    if (error || !nextLiveClass || nextLiveClass.docs.length === 0) {
        return (
             <Card className="p-4 shadow-md rounded-xl text-center">
                <CardHeader>
                    <CardTitle>Next Live Class</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No upcoming live classes scheduled at the moment.</p>
                </CardContent>
            </Card>
        )
    };
    
    const nextClassData = nextLiveClass.docs[0].data();
    const startTime = nextClassData.startTime.toDate();

    return (
        <Card className="p-4 shadow-md rounded-xl text-center">
             <CardHeader>
                <CardTitle>{nextClassData.title}</CardTitle>
                <CardDescription>Next Live Class</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-semibold">{startTime.toLocaleString()}</p>
            </CardContent>
        </Card>
    );
};


export default function DashboardPage() {
    
    const [topStudents, loading, error] = useCollection(
        query(collection(firestore, 'top_students'), orderBy('addedAt', 'desc'), limit(10))
    );

    const topSectionItems = [
      { label: "Today's Course", icon: BookOpen, href: "/dashboard/courses", color: "bg-red-400 text-white" },
      { label: "Upcoming Live Class", icon: Video, href: "/dashboard/live-class", color: "bg-blue-400 text-white" },
      { label: "New Test Series", icon: ShieldQuestion, href: "/dashboard/ai-test", color: "bg-green-500 text-white" },
      { label: "Top Scorer of the Week", icon: Trophy, href: "/dashboard/profile", color: "bg-yellow-500 text-white" },
    ];
    
    const quickAccessItems = [
      { label: "Paid Courses", icon: Wallet, href: "/dashboard/courses", color: "bg-indigo-500" },
      { label: "Test Series", icon: FileText, href: "/dashboard/ai-test", color: "bg-red-500" },
      { label: "Free Classes", icon: PlayCircle, href: "/dashboard/courses", color: "bg-orange-500" },
      { label: "Previous Papers", icon: BookCopy, href: "/dashboard/papers", color: "bg-sky-500" },
      { label: "Current Affairs", icon: Globe, href: "#", color: "bg-teal-500" },
      { label: "Quiz & Games", icon: Puzzle, href: "#", color: "bg-yellow-500" },
    ];
    
  return (
    <div className="flex flex-col h-full bg-background p-4 space-y-6 pb-24 md:pb-4">
      
      {/* Top Section */}
        <div className="grid grid-cols-2 gap-4">
            {topSectionItems.map((item) => (
                <Link href={item.href} key={item.label}>
                    <Card className={`transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl h-full rounded-xl ${item.color}`}>
                        <CardContent className="flex flex-col items-start justify-between gap-2 p-4 aspect-square md:aspect-auto">
                            <div className="p-2 bg-white/30 rounded-full">
                                <item.icon className="h-6 w-6" />
                            </div>
                            <span className="font-semibold">{item.label}</span>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
      
      {/* Quick Access Section */}
      <div>
        <h2 className="text-lg font-bold mb-3">Quick Access</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickAccessItems.map((item) => (
            <Link href={item.href} key={item.label} className="aspect-square">
              <Card className={`h-full transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl ${item.color} text-white rounded-xl`}>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-3 text-center h-full">
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Top 10 Students of the Week */}
      <div>
        <h2 className="text-lg font-bold mb-3">Top 10 Students of the Week</h2>
        {loading && <div className="grid grid-cols-3 gap-4"><Skeleton className="h-40 w-full"/><Skeleton className="h-40 w-full"/><Skeleton className="h-40 w-full"/></div>}
        {topStudents && (
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-2">
              {topStudents.docs.map((doc, index) => {
                const student = doc.data();
                return (
                   <CarouselItem key={doc.id} className="basis-1/3 pl-2">
                     <TopStudentCard rank={index + 1} name={student.name} avatarUrl={student.avatarUrl} />
                   </CarouselItem>
                )
              })}
            </CarouselContent>
            {topStudents.docs.length > 3 && <>
              <CarouselPrevious className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2" />
              <CarouselNext className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2" />
            </>}
          </Carousel>
        )}
      </div>
      
      {/* Next Live Class */}
      <NextLiveClassCard />

    </div>
  );
}
