
'use client';

import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IndianRupee, BookOpen, Clock, Users, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;
  const { user, loading: authLoading } = useAuth();
  
  const [courseDoc, courseLoading, courseError] = useDocument(doc(firestore, 'courses', courseId));
  
  const enrollmentsQuery = user 
    ? query(collection(firestore, 'enrollments'), where('userId', '==', user.uid), where('courseId', '==', courseId), where('status', '==', 'approved'))
    : null;
    
  const [enrollmentDoc, enrollmentLoading, enrollmentError] = useCollection(enrollmentsQuery);

  const isEnrolled = enrollmentDoc && !enrollmentDoc.empty;

  if (courseLoading || authLoading || enrollmentLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (courseError || !courseDoc?.exists()) {
    notFound();
  }

  const course = courseDoc.data();

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="grid md:grid-cols-5 gap-8">
        {/* Left Column (Main Content) */}
        <div className="md:col-span-3 space-y-6">
          <div>
            <p className="text-primary font-semibold mb-1">{course.category}</p>
            <h1 className="text-4xl font-bold font-headline">{course.title}</h1>
          </div>
          <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg">
            <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/800/600`} alt={course.title} layout="fill" objectFit="cover" data-ai-hint="online learning" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>About this course</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{course.description}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              {isEnrolled ? (
                  <div>
                    <p className="text-muted-foreground">Welcome! Here you will find all the course materials. (Content coming soon)</p>
                    {/* Future content like videos, PDFs, quizzes will be listed here */}
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Content Locked</h3>
                    <p className="text-muted-foreground mt-2">
                        Enroll in this course to access all the lessons, videos, and materials.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href={`/dashboard/enroll/${courseId}`}>Enroll Now</Link>
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column (Enrollment Card) */}
        <div className="md:col-span-2">
          <Card className="sticky top-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center">
                <IndianRupee className="h-7 w-7 mr-1" />
                {course.price ? course.price.toLocaleString() : 'Free'}
              </CardTitle>
              <CardDescription>One-time payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEnrolled ? (
                <Button size="lg" className="w-full text-lg" disabled>Enrolled</Button>
              ) : (
                <Button asChild size="lg" className="w-full text-lg">
                   <Link href={`/dashboard/enroll/${courseId}`}>Enroll Now</Link>
                </Button>
              )}
              <div className="space-y-3 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Full course access</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Lifetime access</span>
                </div>
                 <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Community access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
