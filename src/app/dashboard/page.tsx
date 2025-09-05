
"use client";
import {
  BookCheck,
  Briefcase,
  CheckSquare,
  Gamepad2,
  GraduationCap,
  Library,
  Lightbulb,
  Radio,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';

const dashboardGridItems = [
    { label: "स्टूडेंट पोर्टल", icon: Briefcase, href: "/dashboard/profile" },
    { label: "हमारे कोर्स", icon: BookCheck, href: "/dashboard/courses" },
    { label: "लाइव कक्षाएं", icon: Radio, href: "/dashboard/live" },
    { label: "AI टेस्ट", icon: CheckSquare, href: "/dashboard/assessment" },
    { label: "AI ट्यूटर", icon: GraduationCap, href: "/dashboard/tutor" },
    { label: "डेली पांसेस", icon: Library, href: "/dashboard/passes" },
    { label: "क्विज़ गेम", icon: Gamepad2, href: "/dashboard/quiz" },
    { label: "खेल-खेल में सीखें", icon: Star, href: "/dashboard/learn" },
    { label: "पठन-अभ्यास", icon: Lightbulb, href: "/dashboard/practice" },
  ];
  

export default function DashboardPage() {
    const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 p-4 text-center text-primary-foreground shadow-lg">
          <div className="relative h-6 w-full overflow-hidden">
            <p className="absolute whitespace-nowrap text-sm font-medium animate-marquee">
            आपकी उपलब्धि की सफलता को... आपकी उपलब्धि की सफलता को... आपकी उपलब्धि की सफलता को...
            </p>
          </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {dashboardGridItems.map((item) => (
          <Link href={item.href} key={item.label}>
            <Card className="h-full transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl bg-card">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="flex items-center justify-center rounded-full bg-accent p-3 text-primary">
                    <item.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-center">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
