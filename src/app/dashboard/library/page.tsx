
'use client';

import { BookOpenCheck, Trophy, Library } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import Link from 'next/link';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';


const CourseCard = ({ course, courseId }: { course: any, courseId: string }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Link href={`/dashboard/courses/${courseId}`}>
                <div className="relative h-48 w-full">
                    <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/600/400`} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online course" />
                </div>
                <CardHeader>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <CardDescription>{course.category}</CardDescription>
                </CardHeader>
            </Link>
        </Card>
    );
};

export default function LibraryPage() {
    const { user, loading: authLoading } = useAuth();
    
    const enrollmentsQuery = user 
        ? query(
            collection(firestore, 'enrollments'), 
            where('userId', '==', user.uid),
            where('status', '==', 'approved')
        )
        : null;
    const [enrollments, enrollmentsLoading] = useCollection(enrollmentsQuery);

    const enrolledCourseIds = enrollments?.docs.map(doc => doc.data().courseId).filter(Boolean) || [];

    const coursesQuery = user && enrolledCourseIds.length > 0
        ? query(
            collection(firestore, 'courses'),
            where('__name__', 'in', enrolledCourseIds)
        ) : null;
    const [myCourses, myCoursesLoading] = useCollection(coursesQuery);
    
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-3">
                    <Library className="h-10 w-10 text-primary" />
                    My Library
                </h1>
                <p className="text-muted-foreground mt-2">All your learning materials in one place.</p>
            </div>
             <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="courses">My Courses</TabsTrigger>
                    <TabsTrigger value="ebooks">E-Books</TabsTrigger>
                    <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
                </TabsList>
                <TabsContent value="courses" className="mt-6">
                    {(authLoading || enrollmentsLoading || myCoursesLoading) && (
                         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                        </div>
                    )}
                    
                    {!(myCoursesLoading || authLoading) && (!myCourses || myCourses.empty) && (
                         <div className="text-center py-12">
                            <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Courses Here</h3>
                            <p className="mt-1 text-sm text-muted-foreground">You haven't enrolled in any courses yet.</p>
                        </div>
                    )}
                    
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {myCourses?.docs.map(doc => (
                            <CourseCard key={doc.id} course={doc.data()} courseId={doc.id} />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="ebooks" className="mt-6">
                    <div className="text-center py-12">
                        <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">E-Books Coming Soon</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Your purchased e-books will appear here.</p>
                    </div>
                </TabsContent>
                <TabsContent value="scholarships" className="mt-6">
                    <div className="text-center py-12">
                        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Scholarship History</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Your scholarship test history will be shown here.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    