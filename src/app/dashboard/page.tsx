
"use client";
import {
  BookCheck,
  Briefcase,
  CheckSquare,
  GraduationCap,
  Library,
  Lightbulb,
  Radio,
  ShieldQuestion,
  Star,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export default function DashboardPage() {
    const { t } = useLanguage();

    const dashboardGridItems = [
      { label: t('our_courses'), icon: BookCheck, href: "/dashboard/courses", color: "bg-blue-500" },
      { label: t('ai_tests'), icon: ShieldQuestion, href: "/dashboard/ai-test", color: "bg-green-500" },
      { label: t('ai_tutor'), icon: GraduationCap, href: "/dashboard/tutor", color: "bg-orange-500" },
      { label: t('achievements'), icon: Trophy, href: "/dashboard/profile", color: "bg-red-500" },
      { label: t('papers'), icon: Library, href: "/dashboard/papers", color: "bg-purple-500" },
      { label: t('resources'), icon: Lightbulb, href: "/dashboard/courses", color: "bg-teal-500" },
      { label: t('teachers'), icon: Briefcase, href: "/admin", color: "bg-yellow-500" },
      { label: t('live_classes'), icon: Radio, href: "/dashboard/live", color: "bg-pink-500" },
      { label: t('settings'), icon: Star, href: "/dashboard/settings", color: "bg-indigo-500" },
    ];
    
  return (
    <div className="flex flex-col h-full">
      <div className="relative h-[45%] bg-gradient-to-br from-purple-600 via-indigo-700 to-orange-500 p-6 text-primary-foreground flex flex-col justify-center items-center text-center">
          <div className="absolute top-16 left-6 text-lg font-bold">EDUCATION</div>
          <Image 
            src="https://picsum.photos/300/200"
            width={250}
            height={150}
            alt="Student studying"
            className="mb-4 rounded-lg"
            data-ai-hint="student studying"
          />
          <h1 className="text-3xl font-bold">Learn, Practice, Achieve!</h1>
      </div>
      <div className="flex-1 bg-background p-4 -mt-10 rounded-t-3xl shadow-2xl overflow-y-auto">
        <div className="grid grid-cols-3 gap-4">
          {dashboardGridItems.map((item) => (
            <Link href={item.href} key={item.label}>
              <Card className={`h-full transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl ${item.color} text-white`}>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="flex items-center justify-center rounded-full bg-white/20 p-3">
                      <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
