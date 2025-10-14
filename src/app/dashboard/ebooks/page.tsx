'use client';

import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { BookCopy, FileText, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

const EBookCard = ({ ebook, ebookId, isEnrolled }: { ebook: any, ebookId: string, isEnrolled: boolean }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-56 w-full bg-muted">
                <Image src={ebook.thumbnailUrl || `https://picsum.photos/seed/${ebook.id}/600/800`} alt={ebook.title} fill style={{objectFit: "cover"}} data-ai-hint="book cover" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl line-clamp-2">{ebook.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="flex items-center font-bold text-lg mt-4">
                    {ebook.isFree ? 'Free' : (
                        <>
                            <IndianRupee className="h-5 w-5 mr-1" />
                            {ebook.price ? ebook.price.toLocaleString() : 'N/A'}
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={isEnrolled || ebook.isFree ? ebook.fileUrl : `/dashboard/payment-verification?ebookId=${ebookId}`}>
                        {isEnrolled || ebook.isFree ? 'Read Now' : 'Buy Now'}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function EbooksPage() {
    const { user } = useAuth();
    const [ebooks, ebooksLoading, ebooksError] = useCollection(
        query(collection(firestore, 'ebooks'), orderBy('createdAt', 'desc'))
    );
    
    const enrollmentsQuery = user 
        ? query(
            collection(firestore, 'enrollments'), 
            where('userId', '==', user.uid),
            where('status', '==', 'approved'),
            where('enrollmentType', '==', 'E-Book')
        )
        : null;
    const [enrollments] = useCollection(enrollmentsQuery);
    const enrolledEbookIds = new Set(enrollments?.docs.map(doc => doc.data().courseId));
    
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-3">
                    <BookCopy className="h-8 w-8 text-primary" />
                    E-Books
                </h1>
                <p className="text-muted-foreground mt-2">Browse our library of digital books.</p>
            </div>
            {ebooksLoading && (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
            )}
            {ebooksError && <p className="text-destructive text-center">Could not load E-books.</p>}
            
            {!ebooksLoading && (!ebooks || ebooks.empty) && (
                 <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No E-Books Available</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Please check back later for new e-books.</p>
                </div>
            )}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ebooks?.docs.map(doc => {
                    const ebook = doc.data();
                    const isEnrolled = enrolledEbookIds.has(doc.id);
                    return <EBookCard key={doc.id} ebook={ebook} ebookId={doc.id} isEnrolled={isEnrolled} />
                })}
            </div>
        </div>
    )
}
