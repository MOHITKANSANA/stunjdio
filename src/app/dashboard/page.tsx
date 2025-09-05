
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
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

const motivationalLines = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Don't watch the clock; do what it does. Keep going."
];

export default function DashboardPage() {
    const { t } = useLanguage();
    const [currentLine, setCurrentLine] = useState(t('motivational_line'));

    useEffect(() => {
        const lineKey = motivationalLines[Math.floor(Math.random() * motivationalLines.length)];
        // Note: For a real app, you'd want to add these to your locale files.
        // For this demo, we will just display the English version.
        setCurrentLine(lineKey);
    }, []);


    const dashboardGridItems = [
      { label: t('student_portal'), icon: Briefcase, href: "/dashboard/profile" },
      { label: t('our_courses'), icon: BookCheck, href: "/dashboard/courses" },
      { label: t('live_classes'), icon: Radio, href: "/dashboard/live" },
      { label: t('ai_tests'), icon: CheckSquare, href: "/dashboard/assessment" },
      { label: t('ai_tutor'), icon: GraduationCap, href: "/dashboard/tutor" },
      { label: t('daily_passes'), icon: Library, href: "/dashboard/passes" },
      { label: t('quiz_game'), icon: Gamepad2, href: "/dashboard/quiz" },
      { label: t('learn_with_fun'), icon: Star, href: "/dashboard/learn" },
      { label: t('reading_practice'), icon: Lightbulb, href: "/dashboard/practice" },
    ];
    
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 p-4 text-center text-primary-foreground shadow-lg">
          <div className="relative h-6 w-full overflow-hidden">
            <p className="absolute whitespace-nowrap text-sm font-medium animate-marquee">
              {currentLine}
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
