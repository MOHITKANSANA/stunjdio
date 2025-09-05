
"use client"
import Link from 'next/link';
import React from 'react';
import {
  Bell,
  Book,
  BookOpenCheck,
  Briefcase,
  CheckSquare,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Scroll,
  Settings,
  Shield,
  Trophy,
  User,
  Wallet,
} from 'lucide-react';

import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const bottomNavItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/courses', icon: Book, label: 'Courses' },
  { href: '/dashboard/tests', icon: CheckSquare, label: 'Tests' },
  { href: '/dashboard/papers', icon: FileText, label: 'Papers' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
      <div className="flex h-screen w-full flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/50 px-4 md:px-6">
            <div className='flex items-center gap-2'>
                <Shield className="h-7 w-7 text-primary" />
                <span className="text-lg font-semibold font-headline">गो स्वामी डिफेस एकेडमी</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5"/>
                    <span className="sr-only">Notifications</span>
                </Button>
                <UserNav />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
          <footer className="sticky bottom-0 z-10 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden">
              <nav className="flex items-center justify-around p-2">
                {bottomNavItems.map((item) => (
                   <Link 
                     key={item.label}
                     href={item.href}
                     className={cn(
                       "flex flex-col items-center gap-1 rounded-md p-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                       pathname === item.href ? "text-primary" : "text-muted-foreground"
                     )}
                   >
                      <item.icon className="h-6 w-6" />
                      <span>{item.label}</span>
                   </Link>
                ))}
              </nav>
          </footer>
      </div>
  );
}
