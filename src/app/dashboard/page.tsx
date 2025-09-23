
"use client";
import React, { useEffect, useState } from 'react';
import {
  Wallet,
  FileText,
  Globe,
  Puzzle,
  BookOpen,
  Video,
  Award,
  Newspaper,
  BookCopy,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import Image from 'next/image';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import KidsTubeDashboard from './_components/kids-tube-dashboard';

// Main App Dashboard Component
const MainDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [topStudents, setTopStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        const fetchTopStudents = async () => {
            // This is a placeholder for fetching top students.
            // A real implementation would require tracking user activity (e.g., in a separate collection)
            // and using Cloud Functions to calculate top students weekly.
            // For now, we'll fetch a few random users.
            try {
                const usersQuery = query(collection(firestore, 'users'), limit(3));
                const usersSnapshot = await getDocs(usersQuery);
                const students = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTopStudents(students);
            } catch (error) {
                console.error("Error fetching top students:", error);
            } finally {
                setLoadingStudents(false);
            }
        }
        fetchTopStudents();
    }, []);
        
    const quickAccessItems = [
      { label: "Paid Courses", icon: Wallet, href: "/dashboard/courses"},
      { label: "Free Courses", icon: BookOpen, href: "/dashboard/courses/free"},
      { label: "Live Class", icon: Video, href: "/dashboard/live-class"},
      { label: "Test Series", icon: BookCopy, href: "/dashboard/ai-test?tab=series" },
      { label: "AI Tests", icon: Award, href: "/dashboard/ai-test?tab=ai" },
      { label: "Previous Papers", icon: Newspaper, href: "/dashboard/papers" },
    ];
    
    return (
        <div className="flex flex-col h-full bg-background space-y-8 p-4 md:p-6">
            <div className="text-left">
                <h1 className="text-3xl font-bold text-foreground">Hello, {user?.displayName || 'Student'}!</h1>
                <p className="text-muted-foreground">{t('motivational_line')}</p>
            </div>

             {/* Top Students Section */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Top Students of the Week</h2>
                {loadingStudents ? (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {topStudents.map((student, index) => (
                            <Card key={student.id} className="bg-card border-border/60">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={student.photoURL} />
                                        <AvatarFallback>{student.displayName?.charAt(0) || 'S'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-bold text-card-foreground">{student.displayName}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                             <Badge variant={index === 0 ? "default" : "secondary"}>Rank #{index + 1}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>


            <div>
                <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {quickAccessItems.map((item) => (
                    <Link href={item.href} key={item.label} className="text-center">
                    <Card className="transform-gpu transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl bg-card rounded-xl aspect-square border-border/60">
                        <CardContent className="flex flex-col items-center justify-center gap-2 p-2 h-full">
                        <div className="p-3 bg-primary/20 text-primary rounded-full">
                            <item.icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-medium text-center text-card-foreground">{item.label}</span>
                        </CardContent>
                    </Card>
                    </Link>
                ))}
                </div>
            </div>
            
             {/* Student Reviews Section */}
            <div>
                <h2 className="text-2xl font-bold mb-4">What Our Students Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Placeholder Reviews */}
                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
                                <div>
                                    <CardTitle className="text-base">Anjali Sharma</CardTitle>
                                    <div className="flex text-yellow-400"><Star size={16}/><Star size={16}/><Star size={16}/><Star size={16}/><Star size={16}/></div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic">"This app has completely changed the way I study. The live classes are amazing!"</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-card border-border/60">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                 <Avatar><AvatarFallback>R</AvatarFallback></Avatar>
                                <div>
                                    <CardTitle className="text-base">Rahul Verma</CardTitle>
                                     <div className="flex text-yellow-400"><Star size={16}/><Star size={16}/><Star size={16}/><Star size={16}/><Star size={16}/></div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic">"The AI Tutor is like having a personal teacher 24/7. Highly recommended!"</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
};


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [isKidsMode, setIsKidsMode] = useState<boolean | null>(null);

    useEffect(() => {
        const checkUserProfile = async () => {
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setIsKidsMode(userData.ageGroup === '1-9');
                } else {
                    setIsKidsMode(false); // Default for older profiles
                }
            }
        };

        if (!authLoading) {
            checkUserProfile();
        }
    }, [user, authLoading]);

    if (authLoading || isKidsMode === null) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        )
    }

    return isKidsMode ? <KidsTubeDashboard /> : <MainDashboard />;
}
