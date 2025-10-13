
'use client';

import { BookOpenCheck, Library, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


const CourseCard = ({ course, courseId, enrollmentId, onUnenroll }: { course: any, courseId: string, enrollmentId: string, onUnenroll: (id: string, title: string) => void }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-48 w-full">
                <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/600/400`} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online course" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <CardDescription>{course.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                 <Button asChild className="w-full active:scale-95 transition-transform">
                    <Link href={`/dashboard/courses/${courseId}`}>
                       <Eye className="mr-2 h-4 w-4" /> View Course
                    </Link>
                </Button>
                <Button variant="destructive" className="w-full active:scale-95 transition-transform" onClick={() => onUnenroll(enrollmentId, course.title)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Un-enroll
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function MyLearningPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    
    const enrollmentsQuery = user 
        ? query(
            collection(firestore, 'enrollments'), 
            where('userId', '==', user.uid),
            where('status', '==', 'approved')
        )
        : null;
    const [enrollments, enrollmentsLoading, enrollmentsError] = useCollection(enrollmentsQuery);

    const enrolledCourseIds = enrollments?.docs.map(doc => doc.data().courseId).filter(Boolean) || [];

    const coursesQuery = user && enrolledCourseIds.length > 0
        ? query(
            collection(firestore, 'courses'),
            where('__name__', 'in', enrolledCourseIds)
        ) : null;
    const [myCourses, myCoursesLoading, myCoursesError] = useCollection(coursesQuery);
    
    const handleUnenroll = async (enrollmentId: string, courseTitle: string) => {
        if (window.confirm(`Are you sure you want to un-enroll from "${courseTitle}"?`)) {
            try {
                await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
                toast({
                    title: "Un-enrolled successfully",
                    description: `You have been removed from ${courseTitle}.`,
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Un-enrollment failed",
                    description: "Could not remove you from the course. Please try again.",
                });
            }
        }
    };

    const courseIdToEnrollmentIdMap = enrollments?.docs.reduce((acc, doc) => {
        const data = doc.data();
        if (data.courseId) {
            acc[data.courseId] = doc.id;
        }
        return acc;
    }, {} as Record<string, string>);
    
    const paidCourses = myCourses?.docs.filter(doc => !doc.data().isFree);
    const freeCourses = myCourses?.docs.filter(doc => doc.data().isFree);

    const renderCourseGrid = (courses: any[] | undefined) => {
        if (authLoading || enrollmentsLoading || myCoursesLoading) {
             return (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
             );
        }

        if (enrollmentsError || myCoursesError) {
            return <p className="text-destructive text-center">Could not load your courses.</p>;
        }

        if (!courses || courses.length === 0) {
            return (
                <div className="text-center py-12">
                    <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Courses Here</h3>
                    <p className="mt-1 text-sm text-muted-foreground">You haven't enrolled in any courses in this category yet.</p>
                </div>
            );
        }

        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map(doc => {
                    const enrollmentId = courseIdToEnrollmentIdMap?.[doc.id];
                    if (!enrollmentId) return null;
                    return (
                        <CourseCard key={doc.id} course={doc.data()} courseId={doc.id} enrollmentId={enrollmentId} onUnenroll={handleUnenroll}/>
                    )
                })}
            </div>
        );
    };

    
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                 <div className="flex items-center gap-3">
                    <Library className="h-10 w-10 text-primary" />
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">
                        My Library
                    </h1>
                 </div>
                <p className="text-muted-foreground mt-2">All your enrolled courses in one place.</p>
            </div>
             <Tabs defaultValue="paid" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm">
                    <TabsTrigger value="paid">Paid Courses</TabsTrigger>
                    <TabsTrigger value="free">Free Courses</TabsTrigger>
                </TabsList>
                <TabsContent value="paid" className="mt-6">
                    {renderCourseGrid(paidCourses)}
                </TabsContent>
                <TabsContent value="free" className="mt-6">
                    {renderCourseGrid(freeCourses)}
                </TabsContent>
            </Tabs>
        </div>
    );
}
