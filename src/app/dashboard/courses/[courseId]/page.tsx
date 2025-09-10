
'use client';

import { doc } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { firestore } from '@/lib/firebase';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IndianRupee, BookOpen, Clock, Users, Lock, Video, PlayCircle, FileText, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, orderBy } from 'firebase/firestore';

const ContentIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'video': return <Video className="h-5 w-5 text-primary"/>;
        case 'pdf': return <FileText className="h-5 w-5 text-primary"/>;
        case 'note': return <StickyNote className="h-5 w-5 text-primary"/>;
        default: return <BookOpen className="h-5 w-5 text-primary"/>;
    }
}

export default function CourseDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [courseDoc, courseLoading, courseError] = useDocument(doc(firestore, 'courses', courseId));
  const [courseContentCollection, courseContentLoading, courseContentError] = useCollection(
    query(collection(firestore, 'courses', courseId, 'content'), orderBy('createdAt', 'asc'))
  );
  
  const enrollmentsQuery = user 
    ? query(
        collection(firestore, 'enrollments'), 
        where('userId', '==', user.uid), 
        where('courseId', '==', courseId), 
        where('status', '==', 'approved')
      )
    : null;
    
  const [enrollmentDocs, enrollmentLoading, enrollmentError] = useCollection(enrollmentsQuery);

  const isEnrolled = !!enrollmentDocs && !enrollmentDocs.empty;

  if (courseLoading || authLoading || enrollmentLoading || courseContentLoading) {
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
        <div className="md:col-span-3 space-y-6">
          <div>
            <p className="text-primary font-semibold mb-1">{course.category}</p>
            <h1 className="text-4xl font-bold font-headline">{course.title}</h1>
          </div>
          <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg">
            <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/800/600`} alt={course.title} fill style={{objectFit:"cover"}} data-ai-hint="online learning" />
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
                  <div className="space-y-4">
                    {courseContentError && <p className="text-destructive">Could not load course content.</p>}
                    {courseContentCollection && courseContentCollection.docs.length > 0 ? (
                      courseContentCollection.docs.map(doc => {
                        const content = doc.data();
                        return (
                          <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-3">
                               <ContentIcon type={content.type} />
                               <p className="font-semibold">{content.title}</p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                                <a href={content.url} target="_blank" rel="noopener noreferrer">
                                    <PlayCircle className="h-6 w-6" />
                                </a>
                            </Button>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-muted-foreground">No content has been added to this course yet.</p>
                    )}
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Content Locked</h3>
                    <p className="text-muted-foreground mt-2">
                        Enroll in this course to access all the lessons, videos, and materials.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href={`/dashboard/payment-verification?courseId=${courseId}`}>Enroll Now</Link>
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

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
                   <Link href={`/dashboard/payment-verification?courseId=${courseId}`}>Enroll Now</Link>
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
