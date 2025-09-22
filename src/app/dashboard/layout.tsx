
"use client"
import React, { useEffect, useState } from 'react';
import {
  Book,
  Home,
  User,
  Shield,
  GraduationCap,
  Settings,
  ShieldQuestion,
  LogOut,
  UserCog,
  BookCopy,
  Video,
  Award,
  Bell,
  Search,
  MessageSquareQuestion,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

const bottomNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/courses', icon: BookCopy, label: 'My Courses' },
    { href: '/dashboard/live-class', icon: Video, label: 'Live Class' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

const kidsBottomNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/kids/search', icon: Search, label: 'Search' },
    { href: '/dashboard/kids/doubts', icon: HelpCircle, label: 'My Doubts' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
];


const sidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'home' },
    { href: '/dashboard/profile', icon: User, label: 'profile' },
    { href: '/dashboard/courses', icon: Book, label: 'courses' },
    { href: '/dashboard/scholarship', icon: Award, label: 'scholarship' },
    { href: '/dashboard/live-class', icon: Video, label: 'live_classes' },
    { href: '/dashboard/tutor', icon: GraduationCap, label: 'ai_tutor' },
    { href: '/dashboard/ai-test', icon: ShieldQuestion, label: 'ai_tests' },
];

const kidsSidebarNavItems = [
    { href: '/dashboard', icon: Sparkles, label: 'Kids Tube' },
    { href: '/dashboard/profile', icon: User, label: 'My Profile' },
    { href: '/dashboard/kids/doubts', icon: HelpCircle, label: 'My Doubts' },
]

const SidebarMenuItemWithHandler = ({ href, icon: Icon, label, closeSidebar }: { href: string; icon: React.ElementType; label: string; closeSidebar: () => void; }) => {
    const pathname = usePathname();
    const { t } = useLanguage();
    const isActive = pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');

    return (
        <SidebarMenuItem>
            <Link href={href}>
                <SidebarMenuButton isActive={isActive} onClick={closeSidebar}>
                    <Icon />
                    <span>{label}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
    )
}


const AppSidebar = ({ isKidsMode }: { isKidsMode: boolean }) => {
    const { isMobile, setOpenMobile } = useSidebar();
    const { t } = useLanguage();
    const { logout } = useAuth();
    const router = useRouter();

    const closeSidebar = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }
    
    const handleLogout = () => {
        closeSidebar();
        logout();
    }
    
    const handleNavigation = (path: string) => {
        closeSidebar();
        router.push(path);
    }

    const navItems = isKidsMode ? kidsSidebarNavItems : sidebarNavItems;

    return (
        <Sidebar>
            <SidebarContent className="bg-gradient-to-b from-primary to-orange-500 text-white border-none">
                <SidebarHeader>
                     <div className='flex items-center gap-2'>
                        <Shield className="h-7 w-7 text-white" />
                        <span className="text-lg font-semibold font-headline">Go Swami Coaching</span>
                    </div>
                </SidebarHeader>
                <SidebarMenu>
                    {navItems.map((item) => (
                        <SidebarMenuItemWithHandler
                            key={item.label}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            closeSidebar={closeSidebar}
                        />
                    ))}
                     <SidebarMenuItem>
                        <Link href="/admin">
                           <SidebarMenuButton onClick={() => handleNavigation('/admin')}>
                                <UserCog />
                                <span>Admin</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <Link href="/dashboard/settings">
                                <SidebarMenuButton onClick={() => handleNavigation('/dashboard/settings')}>
                                    <Settings />
                                    <span>{t('settings')}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout}>
                                <LogOut />
                                <span>{t('log_out')}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </SidebarContent>
        </Sidebar>
    )
}


const AppHeader = () => {
  return (
      <header className={cn("flex h-16 shrink-0 items-center justify-between gap-4 px-4 md:px-6 bg-primary text-white sticky top-0 z-20")}>
            <div className='flex items-center gap-2'>
                <div className='md:hidden'>
                    <SidebarTrigger />
                </div>
                 <div className="hidden md:flex items-center gap-2 text-lg font-semibold font-headline">
                    Go Swami Coaching
                 </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20 hover:text-white">
                    <Bell />
                    <span className="sr-only">Notifications</span>
                </Button>
            </div>
        </header>
  )
}

const AppBottomNav = ({ isKidsMode }: { isKidsMode: boolean }) => {
    const pathname = usePathname();
    const items = isKidsMode ? kidsBottomNavItems : bottomNavItems;

    return (
         <footer className="sticky bottom-0 z-10 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
              <nav className="flex items-center justify-around p-2">
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


const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Shield className="h-12 w-12 animate-pulse text-primary" />
            <Skeleton className="h-4 w-48" />
        </div>
    </div>
);


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  useEffect(() => {
    if (loading) return;

    if (!user) {
        router.replace('/');
        return;
    }

    const checkUserProfile = async () => {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.ageGroup) {
                router.replace('/dashboard/complete-profile');
            } else {
                setIsKidsMode(userData.ageGroup === '1-9');
                setCheckingProfile(false);
            }
        } else {
            // This case might happen for users who signed up before the new fields were added
            router.replace('/dashboard/complete-profile');
        }
    };
    
    checkUserProfile();

  }, [user, loading, router]);
  
  if (loading || checkingProfile) {
    return <LoadingScreen />;
  }


  return (
      <SidebarProvider>
          <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-950">
             <AppSidebar isKidsMode={isKidsMode} />
             <div className="flex flex-col w-full h-full overflow-hidden">
                <AppHeader />
                 <main className="flex-1 overflow-y-auto h-full">
                    <SidebarInset>
                        <div className="p-4 md:p-6">{children}</div>
                    </SidebarInset>
                </main>
                <AppBottomNav isKidsMode={isKidsMode} />
             </div>
          </div>
      </SidebarProvider>
  );
}
