

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
  HelpCircle,
  Library,
  Trophy,
  Clock,
  Download,
  Youtube,
  Bot,
  Newspaper,
  Clapperboard,
  FileCode,
  FlaskConical,
  Loader2,
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { doc, getDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { AppBottomNav } from './bottom-nav';


const sidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'home' },
    { href: '/dashboard/my-learning', icon: Library, label: 'My Learning' },
    { href: '/dashboard/profile', icon: User, label: 'profile' },
    { href: '/dashboard/courses', icon: Book, label: 'courses' },
    { href: '/dashboard/live-classes', icon: Clapperboard, label: 'Live Classes' },
    { href: '/dashboard/courses/free', icon: BookCopy, label: 'Free Courses' },
    { href: '/dashboard/downloads', icon: Download, label: 'My Downloads' },
    { href: '/dashboard/scholarship', icon: Award, label: 'scholarship' },
    { href: '/dashboard/papers', icon: Newspaper, label: 'Previous Papers' },
    { href: '/dashboard/tutor', icon: Bot, label: 'AI Tutor' },
    { href: '/dashboard/tests', icon: ShieldQuestion, label: 'ai_tests' },
];

const kidsSidebarNavItems = [
    { href: '/dashboard', icon: Youtube, label: 'Kids Tube' },
    { href: '/dashboard/profile', icon: User, label: 'My Profile' },
    { href: '/dashboard/kids/rewards', icon: Trophy, label: 'My Rewards' },
    { href: '/dashboard/kids/doubts', icon: HelpCircle, label: 'My Doubts' },
]

const SidebarMenuItemWithHandler = ({ href, icon: Icon, label, closeSidebar }: { href: string; icon: React.ElementType; label: string; closeSidebar: () => void; }) => {
    const pathname = usePathname();
    const { t } = useLanguage();
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

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
    const [customPages, setCustomPages] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(firestore, "htmlPages"), orderBy("slug"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCustomPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

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
            <SidebarContent className="bg-primary text-primary-foreground border-none">
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

                    {customPages.length > 0 && (
                        <>
                            <SidebarSeparator />
                            <SidebarMenuItem>
                                <div className="px-2 py-1 text-sm font-semibold text-primary-foreground/70">Custom Pages</div>
                            </SidebarMenuItem>
                            {customPages.map((page) => (
                                <SidebarMenuItemWithHandler
                                    key={page.id}
                                    href={`/p/${page.slug}`}
                                    icon={FileCode}
                                    label={page.slug.replace(/-/g, ' ')}
                                    closeSidebar={closeSidebar}
                                />
                            ))}
                        </>
                    )}

                     <SidebarSeparator />
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
                 <div className="flex items-center gap-2 md:gap-4 text-lg font-semibold font-headline">
                    <Link href="/dashboard">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm">Go Swami X</Button>
                    </Link>
                     <Link href="/dashboard/tests">
                        <Button className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm">Test Hub</Button>
                    </Link>
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

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Shield className="h-12 w-12 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading your experience...</p>
        </div>
    </div>
);

const ScreenTimeLock = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white p-8 text-center">
        <Clock className="h-24 w-24 text-primary mb-8" />
        <h1 className="text-4xl font-bold mb-4">Time for a break!</h1>
        <p className="text-lg text-muted-foreground">Your screen time for today is over. See you tomorrow!</p>
    </div>
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [timeUsed, setTimeUsed] = useState(0); // in seconds
  
  const isVideoPlaybackPage = pathname.includes('/video/') || pathname.includes('/live-class/');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const screenTimeLimit = userData.screenTimeLimit; // in minutes
                if (isKidsMode && screenTimeLimit > 0) {
                    if (timer) clearInterval(timer);
                    timer = setInterval(() => {
                        setTimeUsed(prev => {
                            const newTime = prev + 1;
                            if ((newTime / 60) >= screenTimeLimit) {
                                setIsScreenLocked(true);
                                clearInterval(timer);
                            }
                            return newTime;
                        });
                    }, 1000);
                }
            }
        });
        return () => {
            unsubscribe();
            if (timer) clearInterval(timer);
        };
    }
  }, [user, isKidsMode]);

  
  useEffect(() => {
    if (loading) {
        return;
    }

    if (!user) {
        router.replace('/');
        return;
    }

    const checkUserProfile = async () => {
        if (pathname === '/dashboard/complete-profile') {
            setCheckingProfile(false);
            return;
        }

        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.ageGroup) {
                    setIsKidsMode(userData.ageGroup === '1-9');
                    setCheckingProfile(false);
                } else {
                    router.replace('/dashboard/complete-profile');
                }
            } else {
                router.replace('/dashboard/complete-profile');
            }
        } catch (error) {
            console.error("Error checking user profile:", error);
             if (pathname !== '/dashboard/complete-profile') {
                router.replace('/dashboard/complete-profile');
            } else {
                setCheckingProfile(false); 
            }
        }
    };
    
    checkUserProfile();

  }, [user, loading, router, pathname]);
  
  if (loading || checkingProfile) {
    return <LoadingScreen />;
  }


  return (
      <SidebarProvider>
          <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-950">
             {isScreenLocked && <ScreenTimeLock />}
             {!isVideoPlaybackPage && <AppSidebar isKidsMode={isKidsMode} />}
             <div className={cn("flex flex-col w-full h-full overflow-hidden", !isVideoPlaybackPage && "md:pl-[var(--sidebar-width-icon)] group-data-[state=expanded]:md:pl-[var(--sidebar-width)]")}>
                {!isVideoPlaybackPage && <AppHeader />}
                 <main className="flex-1 overflow-y-auto h-full">
                    <SidebarInset>
                        <div className={cn(!isVideoPlaybackPage && 'p-4 md:p-6')}>
                            {children}
                        </div>
                    </SidebarInset>
                </main>
                {!isVideoPlaybackPage && <AppBottomNav isKidsMode={isKidsMode} />}
             </div>
          </div>
      </SidebarProvider>
  );
}
