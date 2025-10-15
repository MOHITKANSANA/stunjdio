
'use client';

import { BookOpenCheck, Library, Trash2, Eye, FileText, Newspaper, BellDot, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

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
    
    const [enrollments, setEnrollments] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const q = query(
                collection(firestore, 'enrollments'),
                where('userId', '==', user.uid),
                where('status', '==', 'approved')
            );
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const now = new Date();
                const validEnrollments: QueryDocumentSnapshot<DocumentData>[] = [];
                for (const doc of snapshot.docs) {
                    const enrollment = doc.data();
                    if (enrollment.enrollmentType === 'Course' && enrollment.courseId) {
                        try {
                            const courseDoc = await getDoc(doc(firestore, 'courses', enrollment.courseId));
                            if (courseDoc.exists()) {
                                const courseData = courseDoc.data();
                                const enrollmentDate = enrollment.createdAt.toDate();
                                const validityDays = courseData.validity || 365; // Default to 365 days if not set
                                const expiryDate = new Date(enrollmentDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
                                if (now < expiryDate) {
                                    validEnrollments.push(doc);
                                }
                            }
                        } catch (e) {
                            console.error("Error fetching course for validity check", e);
                            validEnrollments.push(doc); // failsafe to include if course doc fails
                        }
                    } else {
                        // For non-course enrollments, no validity check needed for now
                        validEnrollments.push(doc);
                    }
                }
                setEnrollments(validEnrollments);
                setEnrollmentsLoading(false);
            }, (error) => {
                console.error("Error fetching enrollments: ", error);
                setEnrollmentsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setEnrollmentsLoading(false);
        }
    }, [user]);

    const enrolledCourseIds = enrollments.filter(doc => doc.data().enrollmentType === 'Course').map(doc => doc.data().courseId).filter(Boolean) || [];
    const coursesQuery = user && enrolledCourseIds.length > 0
        ? query(collection(firestore, 'courses'), where('__name__', 'in', enrolledCourseIds)) : null;
    const [myCourses, myCoursesLoading, myCoursesError] = useCollection(coursesQuery);
    
    const enrolledEbookIds = enrollments.filter(doc => doc.data().enrollmentType === 'E-Book').map(doc => doc.data().courseId).filter(Boolean) || [];
    const ebooksQuery = user && enrolledEbookIds.length > 0
        ? query(collection(firestore, 'ebooks'), where('__name__', 'in', enrolledEbookIds)) : null;
    const [myEbooks, myEbooksLoading, myEbooksError] = useCollection(ebooksQuery);

    const enrolledTestIds = enrollments.filter(doc => doc.data().enrollmentType === 'Test Series').map(doc => doc.data().courseId).filter(Boolean) || [];
    const testsQuery = user && enrolledTestIds.length > 0
        ? query(collection(firestore, 'testSeries'), where('__name__', 'in', enrolledTestIds)) : null;
    const [myTests, myTestsLoading, myTestsError] = useCollection(testsQuery);
    
    const enrolledPaperIds = enrollments.filter(doc => doc.data().enrollmentType === 'Previous Year Paper').map(doc => doc.data().courseId).filter(Boolean) || [];
    const papersQuery = user && enrolledPaperIds.length > 0
        ? query(collection(firestore, 'previousPapers'), where('__name__', 'in', enrolledPaperIds)) : null;
    const [myPapers, myPapersLoading, myPapersError] = useCollection(papersQuery);

    
    const handleUnenroll = async (enrollmentId: string, title: string) => {
        if (window.confirm(`Are you sure you want to un-enroll from "${title}"?`)) {
            try {
                await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
                toast({
                    title: "Un-enrolled successfully",
                    description: `You have been removed from ${title}.`,
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Un-enrollment failed",
                    description: "Could not remove you from the item. Please try again.",
                });
            }
        }
    };

    const createIdMap = (enrollments: QueryDocumentSnapshot<DocumentData>[]) => {
        return enrollments.reduce((acc: Record<string, string>, doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            if (data.courseId) {
                acc[data.courseId] = doc.id;
            }
            return acc;
        }, {} as Record<string, string>);
    }

    const courseIdToEnrollmentIdMap = createIdMap(enrollments);
    
    const renderCourseGrid = (courses: any[] | undefined, isLoading: boolean, error: any) => {
        if (isLoading) {
             return (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
             );
        }

        if (error) {
            return <p className="text-destructive text-center">Could not load your items.</p>;
        }

        if (!courses || courses.length === 0) {
            return (
                <div className="text-center py-12">
                    <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Courses Enrolled</h3>
                    <p className="mt-1 text-sm text-muted-foreground">You haven't enrolled in any courses yet.</p>
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
    
    const renderEbookGrid = () => {
        if (myEbooksLoading) return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-96" />)}</div>
        if (myEbooksError) return <p className="text-destructive">Error loading E-Books.</p>
        if (!myEbooks || myEbooks.empty) return <div className="text-center py-12"><BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No E-Books Found</h3></div>
        
        return (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myEbooks.docs.map(doc => (
                    <Card key={doc.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <Link href={doc.data().fileUrl} target="_blank" className="block">
                            <div className="relative h-56 w-full bg-muted">
                                <Image src={doc.data().thumbnailUrl} alt={doc.data().title} fill style={{objectFit: 'cover'}}/>
                            </div>
                            <CardHeader>
                                <CardTitle>{doc.data().title}</CardTitle>
                            </CardHeader>
                        </Link>
                         <CardFooter>
                              <Button variant="destructive" className="w-full" onClick={() => handleUnenroll(courseIdToEnrollmentIdMap?.[doc.id] || '', doc.data().title)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Remove
                            </Button>
                         </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    const renderTestGrid = (tests: any[] | undefined, isLoading: boolean, error: any, type: string) => {
        if(isLoading) return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_,i) => <Skeleton key={i} className="h-48" />)}</div>
        if(error) return <p className="text-destructive">Error loading {type}.</p>
        if(!tests || tests.length === 0) return <div className="text-center py-12"><FileText className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No {type} Found</h3></div>

        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tests.map(doc => (
                     <Card key={doc.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl">
                        <CardHeader>
                            <CardTitle>{doc.data().title}</CardTitle>
                            <CardDescription>{doc.data().subject || `Year: ${doc.data().year}`}</CardDescription>
                        </CardHeader>
                        <CardFooter className="mt-auto">
                            {type === 'Tests' ? (
                                <Button asChild className="w-full"><Link href={`/dashboard/test-series/${doc.id}`}>Start Test</Link></Button>
                            ) : (
                                 <Button asChild className="w-full"><Link href={doc.data().fileUrl} target="_blank">View Paper</Link></Button>
                            )}
                        </CardFooter>
                     </Card>
                ))}
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
                <p className="text-muted-foreground mt-2">All your enrolled materials in one place.</p>
            </div>
             <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-lg">
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="ebooks">E-Books</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="papers">Papers</TabsTrigger>
                </TabsList>
                <TabsContent value="courses" className="mt-6">
                    {renderCourseGrid(myCourses?.docs, myCoursesLoading || enrollmentsLoading || authLoading, myCoursesError)}
                </TabsContent>
                <TabsContent value="ebooks" className="mt-6">
                    {renderEbookGrid()}
                </TabsContent>
                <TabsContent value="tests" className="mt-6">
                    {renderTestGrid(myTests?.docs, myTestsLoading, myTestsError, "Tests")}
                </TabsContent>
                 <TabsContent value="papers" className="mt-6">
                    {renderTestGrid(myPapers?.docs, myPapersLoading, myPapersError, "Papers")}
                </TabsContent>
            </Tabs>
        </div>
    );
}
