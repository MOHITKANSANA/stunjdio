
'use client';

import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { BookHeart, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

const BookCard = ({ book, bookId }: { book: any, bookId: string }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-56 w-full bg-muted">
                <Image src={book.thumbnailUrl || `https://picsum.photos/seed/${bookId}/600/800`} alt={book.title} fill style={{objectFit: "cover"}} data-ai-hint="book cover" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl line-clamp-2">{book.title}</CardTitle>
                <CardDescription>{book.author || 'Author not available'}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="flex items-center font-bold text-lg mt-4">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {book.price ? book.price.toLocaleString() : 'Free'}
                </div>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/dashboard/book-shala/address?bookId=${bookId}`}>
                        Buy Now
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function BookShalaPage() {
    const { user } = useAuth();
    const [books, booksLoading, booksError] = useCollection(
        query(collection(firestore, 'bookShala'), orderBy('createdAt', 'desc'))
    );
    
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-3">
                    <BookHeart className="h-8 w-8 text-primary" />
                    Book Shala
                </h1>
                <p className="text-muted-foreground mt-2">Purchase books directly from our curated collection.</p>
            </div>
            {booksLoading && (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
            )}
            {booksError && <p className="text-destructive text-center">Could not load books: {booksError.message}</p>}
            
            {!booksLoading && (!books || books.empty) && (
                 <div className="text-center py-12">
                    <BookHeart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Books Available</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Please check back later for new books.</p>
                </div>
            )}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books?.docs.map(doc => {
                    const book = doc.data();
                    return <BookCard key={doc.id} book={book} bookId={doc.id} />
                })}
            </div>
        </div>
    )
}
