
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const CourseCard = ({ course, courseId, isEnrolled }: { course: any, courseId: string, isEnrolled: boolean }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-48 w-full">
                <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/600/400`} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online course" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <CardDescription>{course.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">{course.description}</p>
                <div className="flex items-center font-bold text-lg mt-4">
                    {course.isFree ? 'Free' : (
                        <>
                            <IndianRupee className="h-5 w-5 mr-1" />
                            {course.price ? course.price.toLocaleString() : 'N/A'}
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/dashboard/courses/${courseId}`}>
                        {isEnrolled ? 'View Details' : 'Enroll Now'}
                    </Link>
                 </Button>
            </CardFooter>
        </Card>
    );
};

const CourseGrid = ({ courses, enrollments }: { courses: QueryDocumentSnapshot<DocumentData>[] | undefined, enrollments: any }) => {
    if (!courses) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
            </div>
        );
    }
    
    if (courses.length === 0) {
        return (
            <div className="text-center py-12">
                <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Courses Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">There are no courses in this section yet.</p>
            </div>
        )
    }

    const enrolledCourseIds = new Set(enrollments?.docs.map(doc => doc.data().courseId));

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((doc) => {
                const course = doc.data();
                const isEnrolled = enrolledCourseIds.has(doc.id);
                return <CourseCard key={doc.id} course={course} courseId={doc.id} isEnrolled={isEnrolled} />
            })}
        </div>
    );
};


export default function CoursesPage() {
  const { user } = useAuth();
  
  const [coursesCollection, loading, error] = useCollection(
    query(collection(firestore, 'courses'), orderBy('title', 'asc'))
  );

  const enrollmentsQuery = user 
    ? query(
        collection(firestore, 'enrollments'), 
        where('userId', '==', user.uid),
        where('status', '==', 'approved')
      )
    : null;
  const [enrollments] = useCollection(enrollmentsQuery);
  
  const enrolledCourseIds = new Set(enrollments?.docs.map(doc => doc.data().courseId) || []);

  const allPaidCourses = coursesCollection?.docs.filter(doc => !doc.data().isFree);
  const myCourses = coursesCollection?.docs.filter(doc => enrolledCourseIds.has(doc.id));


  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Courses</h1>
        <p className="text-muted-foreground mt-2">Explore our comprehensive catalog of courses to enhance your skills.</p>
      </div>

      <Tabs defaultValue="all-courses">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="all-courses">All Courses</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
        </TabsList>
        <TabsContent value="all-courses" className="mt-6">
            {error && <p className="text-destructive">Error loading courses: {error.message}</p>}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
            ) : (
                <CourseGrid courses={allPaidCourses} enrollments={enrollments} />
            )}
        </TabsContent>
         <TabsContent value="my-courses" className="mt-6">
            {loading ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
            ) : (
                <CourseGrid courses={myCourses} enrollments={enrollments} />
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
