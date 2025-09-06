
"use client"
import React from 'react';
import {
  Bell,
  Book,
  Home,
  CheckSquare,
  FileText,
  User,
  Shield,
  GraduationCap,
  Settings,
  ShieldQuestion,
  LogOut,
  UserCog,
  BookCopy,
  Download,
  Video,
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
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';

const bottomNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/courses', icon: BookCopy, label: 'My Courses' },
    { href: '#', icon: Video, label: 'Live Class' },
    { href: '#', icon: Download, label: 'Downloads' },
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

const sidebarNavItems = [
    { href: '/dashboard', icon: Home, label: 'home' },
    { href: '/dashboard/profile', icon: User, label: 'profile' },
    { href: '/dashboard/courses', icon: Book, label: 'courses' },
    { href: '/dashboard/tutor', icon: GraduationCap, label: 'ai_tutor' },
    { href: '/dashboard/ai-test', icon: ShieldQuestion, label: 'ai_tests' },
    { href: '/dashboard/papers', icon: FileText, label: 'papers' },
];

const SidebarMenuItemWithHandler = ({ href, icon: Icon, label, closeSidebar }: { href: string; icon: React.ElementType; label: string; closeSidebar: () => void; }) => {
    const pathname = usePathname();
    const { t } = useLanguage();
    const isActive = pathname === href;

    return (
        <SidebarMenuItem>
            <Link href={href}>
                <SidebarMenuButton isActive={isActive} onClick={closeSidebar}>
                    <Icon />
                    <span>{t(label)}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
    )
}


const AppSidebar = () => {
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

    return (
        <Sidebar>
            <SidebarContent className="bg-gradient-to-b from-red-500 to-orange-500 text-white border-none">
                <SidebarHeader>
                     <div className='flex items-center gap-2'>
                        <Shield className="h-7 w-7 text-white" />
                        <span className="text-lg font-semibold font-headline">GoSwami Defence Academy</span>
                    </div>
                </SidebarHeader>
                <SidebarMenu>
                    {sidebarNavItems.map((item) => (
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
      <header className={cn("flex h-16 shrink-0 items-center justify-between gap-4 px-4 md:px-6 bg-red-500 text-white")}>
            <div className='flex items-center gap-2'>
                <div className='md:hidden'>
                    <SidebarTrigger />
                </div>
                 <div className="flex items-center gap-2 text-lg font-semibold font-headline">
                    GoSwami Defence Academy
                 </div>
            </div>
        </header>
  )
}

const AppBottomNav = () => {
    const pathname = usePathname();

    return (
         <footer className="sticky bottom-0 z-10 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
              <nav className="flex items-center justify-around p-2">
                {bottomNavItems.map((item) => (
                   <Link 
                     key={item.label}
                     href={item.href}
                     className={cn(
                       "flex flex-col items-center gap-1 rounded-md p-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground w-16",
                       pathname === item.href ? "text-red-500" : "text-muted-foreground"
                     )}
                   >
                      <item.icon className="h-6 w-6" />
                      <span className="text-center">{item.label}</span>
                   </Link>
                ))}
              </nav>
          </footer>
    )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
      <SidebarProvider>
          <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-950">
             <AppSidebar />
             <div className="flex flex-col w-full h-full overflow-hidden">
                <AppHeader />
                 <main className="flex-1 overflow-y-auto">
                    <SidebarInset>
                        {children}
                    </SidebarInset>
                </main>
                <AppBottomNav />
             </div>
          </div>
      </SidebarProvider>
  );
}
