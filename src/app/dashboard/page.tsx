
"use client";
import {
  Book,
  FileText,
  Trophy,
  Lightbulb,
  Briefcase,
  Radio,
  Settings,
  ShieldQuestion,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { doc } from "firebase/firestore";
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { firestore } from '@/lib/firebase';


export default function DashboardPage() {
    const { t } = useLanguage();
    const [dashboardConfig, loading] = useDocumentData(doc(firestore, 'app_config', 'dashboard'));
    
    const heroImageUrl = dashboardConfig?.heroImageDataUri || "https://picsum.photos/150/100";

    const dashboardGridItems = [
      { label: t('courses'), icon: Book, href: "/dashboard/courses", color: "bg-blue-500" },
      { label: t('ai_tests'), icon: ShieldQuestion, href: "/dashboard/ai-test", color: "bg-green-500" },
      { label: t('papers'), icon: FileText, href: "/dashboard/papers", color: "bg-orange-500" },
      { label: t('achievements'), icon: Trophy, href: "/dashboard/profile", color: "bg-red-500" },
      { label: t('resources'), icon: Lightbulb, href: "/dashboard/courses", color: "bg-purple-500" },
      { label: t('teachers'), icon: Briefcase, href: "/admin", color: "bg-yellow-500" },
      { label: t('live_classes'), icon: Radio, href: "#", color: "bg-pink-500" },
      { label: t('settings'), icon: Settings, href: "/dashboard/settings", color: "bg-indigo-500" },
      { label: t('ai_tutor'), icon: Lightbulb, href: "/dashboard/tutor", color: "bg-teal-500" },
    ];
    
  return (
    <div className="flex flex-col h-full">
      <div className="relative h-[40%] bg-gradient-to-br from-purple-600 via-indigo-700 to-orange-500 p-6 text-primary-foreground flex flex-col justify-center items-center text-center">
          <div className="absolute top-16 left-6 text-lg font-bold">गो स्वामी डिफेस एकेडमी</div>
          {loading ? (
             <div className="w-[150px] h-[100px] bg-white/20 animate-pulse rounded-lg mb-4"></div>
          ) : (
            <Image 
                src={heroImageUrl}
                width={150}
                height={100}
                alt="Student studying"
                className="mb-4 rounded-lg object-cover"
                data-ai-hint="student studying"
                unoptimized
            />
          )}
          <h1 className="text-3xl font-bold">Learn, Practice, Achieve!</h1>
      </div>
      <div className="flex-1 bg-background p-4 -mt-10 rounded-t-3xl shadow-2xl overflow-y-auto pb-24 md:pb-4">
        <div className="grid grid-cols-3 gap-4">
          {dashboardGridItems.map((item) => (
            <Link href={item.href} key={item.label}>
              <Card className={`h-full transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl ${item.color} text-white`}>
                <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center aspect-square">
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
