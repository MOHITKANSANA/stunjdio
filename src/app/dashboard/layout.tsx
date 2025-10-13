
'use client'
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
  Youtube,
  Bot,
  Newspaper,
  Clapperboard,
  FileCode,
  FlaskConical,
  Loader2,
  Users,
  Calendar,
  Info,
  Languages,
  Gift,
  Rss,
} from 'lucide-react';

import { useAuth, updateUserInFirestore } from '@/hooks/use-auth';
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
import { doc, getDoc, onSnapshot, collection, query, orderBy, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { firestore, messaging } from '@/lib/firebase';
import { AppBottomNav } from './bottom-nav';
import { onMessage, getToken } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const sidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'home' },
    { href: '/dashboard/my-learning', icon: Library, label: 'My Library' },
    { href: '/dashboard/ebooks', icon: BookCopy, label: 'E-Books' },
    { href: '/dashboard/profile', icon: User, label: 'profile' },
    { href: '/dashboard/courses', icon: Book, label: 'courses' },
    { href: '/dashboard/live-classes', icon: Clapperboard, label: 'Live Classes' },
    { href: '/dashboard/scholarship', icon: Award, label: 'scholarship' },
    { href: '/dashboard/papers', icon: Newspaper, label: 'Previous Papers' },
    { href: '/dashboard/news', icon: Newspaper, label: 'News' },
    { href: '/dashboard/tutor', icon: Bot, label: 'AI Tutor' },
    { href: '/dashboard/tests', icon: ShieldQuestion, label: 'ai_tests' },
    { href: '/dashboard/golingua', icon: Languages, label: 'GoLingua' },
    { href: '/dashboard/feed', icon: Rss, label: 'Feed' },
];

const kidsSidebarNavItems = [
    { href: '/dashboard', icon: Youtube, label: 'Kids Tube' },
    { href: '/dashboard/profile', icon: User, label: 'My Profile' },
    { href: '/dashboard/kids/rewards', icon: Trophy, label: 'My Rewards' },
    { href: '/dashboard/kids/doubts', icon: HelpCircle, label: 'My Doubts' },
]

const mindSphereSidebarNavItems = [
    { href: '/dashboard/mindsphere', icon: Home, label: 'Home' },
    { href: '/dashboard/mindsphere/library', icon: Library, label: 'Library' },
    { href: '/dashboard/mindsphere/community', icon: Users, label: 'Community' },
    { href: '/dashboard/mindsphere/planner', icon: Calendar, label: 'Planner' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
];


const SidebarMenuItemWithHandler = ({ href, icon: Icon, label, closeSidebar }: { href: string; icon: React.ElementType; label: string; closeSidebar: () => void; }) => {
    const pathname = usePathname();
    const { t } = useLanguage();
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    const [activeButton, setActiveButton] = useState<string | null>(null);

    const handlePress = () => {
        setActiveButton(label);
        setTimeout(() => {
            setActiveButton(null);
            closeSidebar();
        }, 300);
    };


    return (
        <SidebarMenuItem>
            <Link href={href} onClick={handlePress}>
                <SidebarMenuButton isActive={isActive} className={cn(activeButton === label && 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar-background')}>
                    <Icon />
                    <span className="capitalize">{label}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
    )
}


const AppSidebar = ({ isKidsMode, isMindSphereMode, appLogoUrl }: { isKidsMode: boolean, isMindSphereMode: boolean, appLogoUrl: string | null }) => {
    const { isMobile, setOpenMobile } = useSidebar();
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const router = useRouter();
    const [customPages, setCustomPages] = useState<any[]>([]);
     const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const q = query(collection(firestore, "htmlPages"), orderBy("slug"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCustomPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);
    
     useEffect(() => {
        if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
            setUserData(docSnap.data());
            }
        });
        return () => unsubscribe();
        }
    }, [user]);

    const closeSidebar = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }
    
    const handleLogout = () => {
        closeSidebar();
        logout();
    }
    
    const navItems = isKidsMode 
        ? kidsSidebarNavItems 
        : isMindSphereMode 
        ? mindSphereSidebarNavItems
        : sidebarNavItems;

    return (
        <Sidebar>
            <SidebarContent className="bg-sidebar border-r border-sidebar-border w-[250px] group-data-[collapsible=icon]:w-[52px]">
                <div className="flex flex-col h-full">
                     <div className="p-3 bg-yellow-400/10 m-2 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-yellow-400">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback className="bg-background text-foreground">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                             <div className="group-data-[collapsible=icon]:hidden">
                                <p className="font-bold text-yellow-300">{user?.displayName}</p>
                                <p className="text-xs text-yellow-300/70">{userData?.phone || user?.email}</p>
                            </div>
                        </div>
                    </div>
                    
                    <SidebarMenu className="flex-1 px-2">
                        {navItems.map((item) => (
                            <SidebarMenuItemWithHandler
                                key={item.label}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                closeSidebar={closeSidebar}
                            />
                        ))}

                        <SidebarMenuItemWithHandler
                            href="/p/why-us"
                            icon={Info}
                            label="Why Us"
                            closeSidebar={closeSidebar}
                        />

                        {customPages.map((page) => {
                            if (page.id === 'why-us') return null; // Avoid duplicating "Why Us"
                            return (
                                <SidebarMenuItemWithHandler
                                    key={page.id}
                                    href={`/p/${page.slug}`}
                                    icon={FileCode}
                                    label={page.slug.replace(/-/g, ' ')}
                                    closeSidebar={closeSidebar}
                                />
                            )
                        })}
                        {userData?.isAdmin && (
                            <>
                            <SidebarSeparator />
                            <SidebarMenuItem>
                                <Link href="/admin" onClick={closeSidebar}>
                                <SidebarMenuButton>
                                        <UserCog />
                                        <span>Admin</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                            </>
                        )}
                    </SidebarMenu>

                    <div className="p-3 bg-yellow-400/10 m-2 rounded-lg group-data-[collapsible=icon]:hidden">
                        <Link href="/refer">
                             <div className="flex items-center gap-3 justify-center">
                                <Gift className="text-yellow-400 h-8 w-8" />
                                <div>
                                    <p className="font-bold text-yellow-300">Refer &amp; Earn</p>
                                    <p className="text-xs text-yellow-300/70">Invite friends &amp; get rewards</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <SidebarFooter className="px-2 pb-2">
                        <SidebarMenu>
                             <SidebarMenuItem>
                                <Link href="/dashboard/settings" onClick={closeSidebar}>
                                    <SidebarMenuButton>
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
                </div>
            </SidebarContent>
        </Sidebar>
    )
}


const AppHeader = ({ appLogoUrl }: { appLogoUrl: string | null }) => {
  const { user } = useAuth();
  return (
      <header className={cn("flex h-16 shrink-0 items-center justify-between gap-4 px-4 md:px-6 bg-transparent sticky top-0 z-20")}>
            <div className='flex items-center gap-4'>
                <div className='md:hidden'>
                    <SidebarTrigger />
                </div>
                 <div className='hidden md:flex items-center gap-2'>
                    <h1 className="text-2xl font-bold text-white">Hello, {user?.displayName || 'Student'}!</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full" asChild>
                    <Link href="/dashboard/my-learning?tab=notifications">
                       <Bell className='text-white' />
                       <span className="sr-only">Notifications</span>
                    </Link>
                </Button>
            </div>
        </header>
  )
}

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [timeUsed, setTimeUsed] = useState(0); // in seconds
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const isVideoPlaybackPage = pathname.includes('/video/') || pathname.includes('/live-class/');
  const isMindSphereMode = pathname.startsWith('/dashboard/mindsphere');

  // Handle foreground messages
  useEffect(() => {
    let unsubscribe: () => void;
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.Worker && messaging) {
        unsubscribe = onMessage(messaging, (payload: any) => {
            console.log('Foreground message received.', payload);
            toast({
              title: payload.notification?.title,
              description: payload.notification?.body,
            });
        });
    }
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [toast]);

  // Request permission and register service worker
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (!user || !messaging || !('serviceWorker' in navigator)) return;

      try {
        const swRegistration = await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, { 
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: swRegistration 
          });
          if (currentToken) {
            console.log('FCM Token generated:', currentToken);
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && (!userDoc.data().fcmTokens || !userDoc.data().fcmTokens.includes(currentToken))) {
                await updateDoc(userDocRef, {
                    fcmTokens: arrayUnion(currentToken)
                });
                console.log('FCM Token saved to Firestore.');
            }
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (err: any) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered with scope:', registration.scope);
                // After successful registration, request permission
                if(user) {
                    setTimeout(requestNotificationPermission, 2000); // Add a small delay
                }
            } catch (err) {
                console.error('Service Worker registration failed:', err);
            }
        }
    };

    registerServiceWorker();

  }, [user]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (user && isKidsMode) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const screenTimeLimit = userData.screenTimeLimit; // in minutes
                if (screenTimeLimit > 0) {
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
            return;
        }

        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.ageGroup) {
                    setIsKidsMode(userData.ageGroup === '1-9');
                } else {
                    router.replace('/dashboard/complete-profile');
                }
            } else {
                // If doc doesn't exist, create it before redirecting
                await updateUserInFirestore(user);
                router.replace('/dashboard/complete-profile');
            }
        } catch (error) {
            console.error("Error checking user profile:", error);
             if (pathname !== '/dashboard/complete-profile') {
                router.replace('/dashboard/complete-profile');
            }
        }
    };
    
    checkUserProfile();

    // Fetch App Logo
     const appConfigUnsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
        if (doc.exists()) {
            setAppLogoUrl(doc.data().appLogoUrl || null);
        }
     });

    return () => appConfigUnsub();

  }, [user, loading, router, pathname]);
  
  if (loading) {
    return <LoadingScreen />;
  }


  return (
      <SidebarProvider>
          <div className="flex h-screen w-full flex-col bg-background">
             {isScreenLocked && <ScreenTimeLock />}
             <div 
                 className="fixed top-0 left-0 right-0 h-[30vh] bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-300 -z-10" 
                 style={{clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'}}
            />
             {!isVideoPlaybackPage && <AppHeader appLogoUrl={appLogoUrl} />}
             <div className={cn("flex flex-col md:flex-row w-full h-full overflow-hidden")}>
                {!isVideoPlaybackPage && <AppSidebar isKidsMode={isKidsMode} isMindSphereMode={isMindSphereMode} appLogoUrl={appLogoUrl} />}
                 <main className="flex-1 overflow-y-auto h-full">
                    <SidebarInset>
                        <div className={cn(!isVideoPlaybackPage && 'p-4 md:p-6')}>
                            {children}
                        </div>
                    </SidebarInset>
                </main>
             </div>
             {!isVideoPlaybackPage && <AppBottomNav isKidsMode={isKidsMode} isMindSphereMode={isMindSphereMode} />}
          </div>
      </SidebarProvider>
  );
}
