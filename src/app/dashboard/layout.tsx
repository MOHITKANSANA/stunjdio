
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
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { UserNav } from '@/components/user-nav';
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
    { href: '/dashboard', icon: Home, label: 'home' },
    { href: '/dashboard/courses', icon: Book, label: 'courses' },
    { href: '/dashboard/ai-test', icon: CheckSquare, label: 'ai_tests' },
    { href: '/dashboard/papers', icon: FileText, label: 'papers' },
    { href: '/dashboard/profile', icon: User, label: 'profile' },
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
            <Link href={href} passHref legacyBehavior>
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
            <SidebarContent>
                <SidebarHeader>
                     <div className='flex items-center gap-2'>
                        <Shield className="h-7 w-7 text-primary" />
                        <span className="text-lg font-semibold font-headline">गो स्वामी डिफेस एकेडमी</span>
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
                        <Link href="/admin" passHref legacyBehavior>
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
                            <Link href="/dashboard/settings" passHref legacyBehavior>
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
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/50 px-4 md:px-6">
            <div className='flex items-center gap-2'>
                <div className='md:hidden'>
                    <SidebarTrigger />
                </div>
                 <div className='hidden md:flex items-center gap-2'>
                    <Shield className="h-7 w-7 text-primary" />
                    <span className="text-lg font-semibold font-headline">गो स्वामी डिफेस एकेडमी</span>
                 </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5"/>
                    <span className="sr-only">Notifications</span>
                </Button>
                <UserNav />
            </div>
        </header>
  )
}

const AppBottomNav = () => {
    const pathname = usePathname();
    const { t } = useLanguage();

    return (
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
                      <span>{t(item.label)}</span>
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
          <div className="flex h-screen w-full flex-col bg-background">
             <AppSidebar />
             <div className="flex flex-col w-full">
                <AppHeader />
                 <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
