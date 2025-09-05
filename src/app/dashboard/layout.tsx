
"use client"
import Link from 'next/link';
import {
  Bell,
  Book,
  BookOpenCheck,
  Briefcase,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
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

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/courses', icon: Wallet, label: 'Paid Courses' },
  { href: '/dashboard/tests', icon: FileText, label: 'Test Series' },
  { href: '/dashboard/free-courses', icon: GraduationCap, label: 'Free Courses' },
  { href: '/dashboard/papers', icon: Newspaper, label: 'Previous Papers' },
  { href: '/dashboard/affairs', icon: Globe, label: 'Current Affairs' },
  { href: '/dashboard/quiz', icon: Trophy, label: 'Quiz' },
  { href: '/dashboard/syllabus', icon: Scroll, label: 'Syllabus' },
  { href: '/dashboard/books', icon: Book, label: 'Our Books' },
  { href: '/dashboard/alerts', icon: Briefcase, label: 'Job Alerts' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

const bottomNavItems = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { href: '/admin', icon: Shield, label: 'Admin' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
             <div className="flex items-center gap-2 overflow-hidden px-2">
                <BookOpenCheck className="size-6 shrink-0 text-primary" />
                <span className="text-lg font-semibold font-headline">Go Swami</span>
             </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className='mt-auto'>
             <SidebarMenu>
                {bottomNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <Link href="/">
                    <SidebarMenuButton tooltip="Log Out">
                      <LogOut />
                      <span>Log Out</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
               {/* Header content like a search bar can go here */}
            </div>
            <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5"/>
                <span className="sr-only">Notifications</span>
            </Button>
            <UserNav />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
