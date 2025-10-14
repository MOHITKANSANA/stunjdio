'use client';
import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Newspaper, FileText, Download, Eye, IndianRupee, BookOpenCheck } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

const PaperCard = ({ paper, paperId, isEnrolled }: { paper: any, paperId: string, isEnrolled: boolean }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle>{paper.title}</CardTitle>
                    <Newspaper className="h-6 w-6 text-primary shrink-0" />
                </div>
                <CardDescription>Year: {paper.year}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="flex items-center font-bold text-lg mt-4">
                    {paper.isFree ? 'Free' : (
                        <>
                            <IndianRupee className="h-5 w-5 mr-1" />
                            {paper.price ? paper.price.toLocaleString() : 'N/A'}
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={isEnrolled || paper.isFree ? paper.fileUrl : `/dashboard/payment-verification?paperId=${paperId}`}>
                        {isEnrolled || paper.isFree ? 'View Paper' : 'Buy Now'}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function PapersPage() {
  const [papersCollection, loading, error] = useCollection(
    query(collection(firestore, 'previousPapers'), orderBy('year', 'desc'))
  );
  
  const { user } = useAuth();
  
  const enrollmentsQuery = user 
    ? query(
        collection(firestore, 'enrollments'), 
        where('userId', '==', user.uid),
        where('status', '==', 'approved'),
        where('enrollmentType', '==', 'Previous Year Paper')
      )
    : null;
  const [enrollments] = useCollection(enrollmentsQuery);
  const enrolledPaperIds = new Set(enrollments?.docs.map(doc => doc.data().courseId));


  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Previous Year Papers</h1>
        <p className="text-muted-foreground mt-2">Practice with papers from previous years to understand the exam pattern.</p>
      </div>

       <div>
            {loading && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            )}

            {error && <p className="text-destructive">Error: {error.message}</p>}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {papersCollection?.docs.map((doc) => {
                    const paper = doc.data();
                    const isEnrolled = enrolledPaperIds.has(doc.id);
                    return <PaperCard key={doc.id} paper={paper} paperId={doc.id} isEnrolled={isEnrolled} />
                })}
            </div>

            {papersCollection?.docs.length === 0 && !loading && (
                 <div className="text-center py-12">
                    <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Papers Available</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Previous year papers will be added here soon.</p>
                </div>
            )}
        </div>
    </div>
  );
}
