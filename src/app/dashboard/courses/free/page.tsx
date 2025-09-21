
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpenCheck } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';


const FreeCourseCard = ({ course, courseId }: { course: any, courseId: string }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const handleFreeEnroll = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to enroll.' });
            return;
        }
        try {
            await addDoc(collection(firestore, 'enrollments'), {
                enrollmentType: 'Course Enrollment',
                courseId: courseId,
                courseTitle: course.title,
                screenshotDataUrl: 'https://placehold.co/600x400/E0FFFF/000000?text=Free+Course',
                userId: user.uid,
                userEmail: user.email,
                userDisplayName: user.displayName,
                status: 'approved', // Auto-approved for free courses
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Enrolled Successfully!', description: `You can now access ${course.title}.` });
            router.push(`/dashboard/courses/${courseId}`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Enrollment Failed', description: 'Could not enroll in the course.' });
        }
    };
    
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-48 w-full">
                <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/600/400`} alt={course.title} layout="fill" objectFit="cover" data-ai-hint="online course" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <CardDescription>{course.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">{course.description}</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={handleFreeEnroll}>Enroll for Free</Button>
            </CardFooter>
        </Card>
    );
};

export default function FreeCoursesPage() {
  // Fetch all courses without filtering by isFree to avoid composite index requirement.
  // We will filter and sort on the client side.
  const [coursesCollection, loading, error] = useCollection(
    query(collection(firestore, 'courses'), orderBy('title', 'asc'))
  );

  // Client-side filtering for free courses
  const freeCourses = coursesCollection?.docs.filter(doc => doc.data().isFree);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Free Courses</h1>
        <p className="text-muted-foreground mt-2">Enroll in our free courses and start learning today!</p>
      </div>
      
      {loading && (
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
            </div>
      )}
      {error && <p className="text-destructive">Error loading courses: {error.message}</p>}

      {!loading && freeCourses && freeCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Free Courses Available</h3>
            <p className="mt-1 text-sm text-muted-foreground">Please check back later for free courses.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {freeCourses?.map((doc) => (
          <FreeCourseCard key={doc.id} course={doc.data()} courseId={doc.id} />
        ))}
      </div>
    </div>
  );
}
