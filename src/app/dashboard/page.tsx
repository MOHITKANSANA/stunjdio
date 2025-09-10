
"use client";
import React from 'react';
import {
  Wallet,
  FileText,
  Globe,
  Puzzle,
  BookCopy,
  Video,
  Award,
  BookOpen,
  Newspaper
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';

export default function DashboardPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    const quickAccessItems = [
      { label: "Paid Courses", icon: Wallet, href: "/dashboard/courses"},
      { label: "Free Courses", icon: BookOpen, href: "/dashboard/courses/free"},
      { label: "Live Class", icon: Video, href: "/dashboard/live-class"},
      { label: "Test Series", icon: FileText, href: "/dashboard/ai-test?tab=series" },
      { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers" },
      { label: "Current Affairs", icon: Globe, href: "#" },
      { label: "Quiz & Games", icon: Puzzle, href: "#"},
      { label: "AI Tests", icon: Award, href: "/dashboard/ai-test?tab=ai" },
      { label: "Scholarship", icon: Award, href: "/dashboard/scholarship" },
    ];
    
  return (
    <div className="flex flex-col h-full bg-background space-y-6">
      
        <h2 className="text-2xl font-bold">Hello, {user?.displayName || 'Student'}!</h2>
      
      {/* Quick Access Section */}
      <div>
        <h2 className="text-lg font-bold mb-3">Quick Access</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickAccessItems.map((item) => (
            <Link href={item.href} key={item.label}>
              <Card className="transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl bg-primary/10 text-primary-foreground rounded-xl aspect-square">
                <CardContent className="flex flex-col items-center justify-center gap-2 p-2 text-center h-full">
                  <div className="p-3 bg-primary text-white rounded-full">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-center text-primary dark:text-white">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
