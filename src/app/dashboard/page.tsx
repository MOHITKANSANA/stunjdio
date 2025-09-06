
"use client";
import {
  BookOpen,
  Video,
  Newspaper,
  Trophy,
  Wallet,
  FileText,
  PlayCircle,
  BookCopy,
  Globe,
  Puzzle,
  Scroll,
  Briefcase,
  User,
  ShieldQuestion
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const TopStudentCard = ({ rank, name, avatarUrl }: { rank: number, name: string, avatarUrl: string }) => (
    <Card className="flex flex-col items-center justify-center p-4 shadow-md h-full">
        <div className="relative mb-2">
            <Avatar className="h-16 w-16 border-2 border-yellow-400">
                <AvatarImage src={avatarUrl} alt={name} data-ai-hint="student" />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                {rank}
            </div>
        </div>
        <p className="font-semibold text-sm mt-2 text-center">{name}</p>
    </Card>
)

const LiveClassCountdown = () => {
    const [liveClasses, loading, error] = useCollection(
        query(collection(firestore, 'live_classes'), orderBy('startTime', 'asc'))
    );
    const [timeLeft, setTimeLeft] = useState<any>(null);
    const [nextClass, setNextClass] = useState<any>(null);

    useEffect(() => {
        if (liveClasses) {
            const upcomingClasses = liveClasses.docs.filter(doc => (doc.data().startTime.seconds * 1000) > new Date().getTime());
            if (upcomingClasses.length > 0) {
                const next = upcomingClasses[0].data();
                setNextClass(next);
            }
        }
    }, [liveClasses]);

    useEffect(() => {
        if (!nextClass) return;

        const calculateTimeLeft = () => {
            const difference = (nextClass.startTime.seconds * 1000) - new Date().getTime();
            let newTimeLeft = {};

            if (difference > 0) {
                newTimeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return newTimeLeft;
        };
        
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [nextClass]);
    
    if (loading) return <Skeleton className="h-24 w-full" />;
    if (!nextClass || !timeLeft || Object.keys(timeLeft).length === 0) {
        return (
            <div className="text-center">
                <h3 className="font-semibold mb-2">No upcoming live classes.</h3>
            </div>
        )
    };


    return (
        <div className="text-center">
            <h3 className="font-semibold mb-2">{nextClass.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">Starts in</p>
            <div className="flex justify-center items-center gap-2">
                {timeLeft.days > 0 && <div className="text-center"><div className="font-bold text-3xl">{timeLeft.days}</div><div className="text-xs">days</div></div>}
                <div className="text-center"><div className="font-bold text-3xl">{timeLeft.hours}</div><div className="text-xs">hours</div></div>
                <div className="text-center"><div className="font-bold text-3xl">{timeLeft.minutes}</div><div className="text-xs">min</div></div>
                <div className="text-center"><div className="font-bold text-3xl">{timeLeft.seconds}</div><div className="text-xs">sec</div></div>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    
    const [topStudents, loading, error] = useCollection(
        query(collection(firestore, 'top_students'), orderBy('addedAt', 'desc'))
    );

    const topSectionItems = [
      { label: "Today's Course", icon: BookOpen, href: "/dashboard/courses" },
      { label: "Upcoming Live Class", icon: Video, href: "/dashboard/live-class" },
      { label: "New Test Series", icon: ShieldQuestion, href: "/dashboard/ai-test" },
      { label: "Top Scorer", icon: Trophy, href: "/dashboard/profile" },
      { label: "Current Affairs", icon: Globe, href: "#"},
      { label: "Previous Papers", icon: BookCopy, href: "/dashboard/papers" },
    ];
    
    const quickAccessItems = [
      { label: "Paid Courses", icon: Wallet, href: "/dashboard/courses", color: "bg-indigo-500" },
      { label: "Test Series", icon: FileText, href: "/dashboard/ai-test", color: "bg-red-500" },
      { label: "Free Classes", icon: PlayCircle, href: "/dashboard/courses", color: "bg-orange-500" },
      { label: "Previous Year Papers", icon: BookCopy, href: "/dashboard/papers", color: "bg-sky-500" },
      { label: "Current Affairs", icon: Globe, href: "#", color: "bg-teal-500" },
      { label: "Quiz & Games", icon: Puzzle, href: "#", color: "bg-yellow-500" },
      { label: "Our Books Notes PDF", icon: Scroll, href: "#", color: "bg-emerald-500" },
      { label: "Job Alerts", icon: Briefcase, href: "#", color: "bg-amber-600" },
    ];
    
  return (
    <div className="flex flex-col h-full bg-background p-4 space-y-6 pb-24 md:pb-4">
      
      {/* Top Section */}
      <div className="grid grid-cols-3 gap-4">
        {topSectionItems.map((item) => (
            <Link href={item.href} key={item.label}>
                <Card className="transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl h-full">
                    <CardContent className="flex flex-col items-center justify-center gap-2 p-3 text-center aspect-square">
                         <div className="p-3 bg-red-100 text-red-600 rounded-full">
                            <item.icon className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>
      
      {/* Quick Access Section */}
      <div>
        <h2 className="text-lg font-bold mb-3">Quick Access</h2>
        <div className="grid grid-cols-4 gap-4">
          {quickAccessItems.map((item) => (
            <Link href={item.href} key={item.label}>
              <Card className={`h-full transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl ${item.color} text-white`}>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-3 text-center aspect-square">
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
              <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
            </>}
          </Carousel>
        )}
      </div>
      
      {/* Next Live Class Countdown */}
      <Card className="p-4 shadow-md">
        <LiveClassCountdown />
      </Card>

    </div>
  );
}
