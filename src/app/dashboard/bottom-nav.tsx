
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Bot, User, Search, HelpCircle, Users, BookOpen, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainBottomNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/my-learning', icon: Library, label: 'Library' },
    { href: '/dashboard/community', icon: Users, label: 'Community' },
    { href: '/dashboard/planner', icon: Calendar, label: 'Planner' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

const kidsBottomNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/kids/search', icon: Search, label: 'Search' },
    { href: '/dashboard/kids/doubts', icon: HelpCircle, label: 'My Doubts' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export const AppBottomNav = ({ isKidsMode }: { isKidsMode: boolean }) => {
    const pathname = usePathname();
    const items = isKidsMode ? kidsBottomNavItems : mainBottomNavItems;

    return (
         <footer className="sticky bottom-0 z-10 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
              <nav className="flex items-center justify-around p-1">
                {items.map((item) => (
                   <Link 
                     key={item.label}
                     href={item.href}
                     className={cn(
                       "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground w-16 h-14",
                       pathname === item.href ? "text-primary" : "text-muted-foreground"
                     )}
                   >
                      <item.icon className="h-6 w-6" />
                      <span className="text-center text-[10px] leading-tight">{item.label}</span>
                   </Link>
                ))}
              </nav>
          </footer>
    )
}
