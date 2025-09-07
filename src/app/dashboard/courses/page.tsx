
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CoursesPage() {
  const [coursesCollection, loading, error] = useCollection(
    query(collection(firestore, 'courses'), orderBy('createdAt', 'desc'))
  );

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Our Courses</h1>
        <p className="text-muted-foreground mt-2">Explore our comprehensive catalog of courses to enhance your skills.</p>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      )}
      {error && <p className="text-destructive">Error loading courses: {error.message}</p>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coursesCollection && coursesCollection.docs.map((doc) => {
          const course = doc.data();
          return (
            <Card key={doc.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
               <div className="relative h-48 w-full">
                 <Image src={course.imageUrl || `https://picsum.photos/seed/${doc.id}/600/400`} alt={course.title} layout="fill" objectFit="cover" data-ai-hint="online course" />
               </div>
              <CardHeader>
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <CardDescription>{course.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">{course.description}</p>
                 <div className="flex items-center font-bold text-lg mt-4">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {course.price ? course.price.toLocaleString() : 'Free'}
                 </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 items-stretch">
                 <Button asChild className="flex-1">
                    <Link href={`/dashboard/enroll/${doc.id}`}>
                        Enroll Now
                    </Link>
                 </Button>
                 <Button asChild variant="outline" className="flex-1">
                    <Link href={`/dashboard/courses/${doc.id}`}>
                        View Details
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
