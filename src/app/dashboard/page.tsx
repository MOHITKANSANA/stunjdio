
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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';

const TopStudentCard = ({ rank, name, avatarUrl }: { rank: number, name: string, avatarUrl: string }) => (
    <Card className="flex flex-col items-center justify-center p-4 shadow-md">
        <div className="relative mb-2">
            <Avatar className="h-16 w-16 border-2 border-yellow-400">
                <AvatarImage src={avatarUrl} alt={name} data-ai-hint="student" />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                {rank}
            </div>
        </div>
        <p className="font-semibold text-sm mt-2">{name}</p>
    </Card>
)

const LiveClassCountdown = () => {
    const calculateTimeLeft = () => {
        // Set a future date for the countdown. For demonstration, let's set it to 12 hours 50 mins 40 secs from now.
        const difference = new Date().getTime() + (12 * 60 * 60 * 1000) + (50 * 60 * 1000) + (40 * 1000) - new Date().getTime();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    return (
        <div className="text-center">
            <h3 className="font-semibold mb-2">Next Live Class Starts in</h3>
            <div className="flex justify-center items-end gap-2">
                <div className="font-bold text-4xl">{timeLeft.hours || '00'}</div>
                <div className="text-muted-foreground text-sm -mb-1">hour</div>
                <div className="font-bold text-4xl">{timeLeft.minutes || '00'}</div>
                 <div className="text-muted-foreground text-sm -mb-1">min</div>
                <div className="font-bold text-4xl">{timeLeft.seconds || '00'}</div>
                 <div className="text-muted-foreground text-sm -mb-1">sec</div>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    
    const topSectionItems = [
      { label: "Today's Course", icon: BookOpen, href: "/dashboard/courses", color: "bg-pink-500 text-white" },
      { label: "Upcoming Live Class", icon: Video, href: "#", color: "bg-blue-400 text-white" },
      { label: "New Test Series", icon: Newspaper, href: "/dashboard/ai-test", color: "bg-green-500 text-white" },
      { label: "Top Scorer of the Week", icon: Trophy, href: "/dashboard/profile", color: "bg-orange-400 text-white" },
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
      <div className="grid grid-cols-2 gap-4">
        {topSectionItems.map((item) => (
            <Link href={item.href} key={item.label}>
                <Card className={`transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl ${item.color}`}>
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <item.icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
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
        <div className="grid grid-cols-3 gap-4">
            <TopStudentCard rank={1} name="Anjali" avatarUrl="https://picsum.photos/100/100?random=1" />
            <TopStudentCard rank={2} name="Rohan" avatarUrl="https://picsum.photos/100/100?random=2" />
            <TopStudentCard rank={3} name="Priya" avatarUrl="https://picsum.photos/100/100?random=3" />
        </div>
      </div>
      
      {/* Next Live Class Countdown */}
      <Card className="p-4 shadow-md">
        <LiveClassCountdown />
      </Card>

    </div>
  );
}
