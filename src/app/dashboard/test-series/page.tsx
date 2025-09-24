
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function TestSeriesListPage() {
    const [testSeriesCollection, loading, error] = useCollection(
        query(collection(firestore, 'testSeries'), orderBy('createdAt', 'desc'))
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Practice Test Series</h1>
                <p className="text-muted-foreground mt-2">Select a test from our curated series to practice.</p>
            </div>
            
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            ) : error ? (
                <p className="text-destructive text-center">Could not load test series.</p>
            ) : testSeriesCollection && !testSeriesCollection.empty ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {testSeriesCollection.docs.map(doc => (
                        <Link key={doc.id} href={`/dashboard/test-series/${doc.id}`}>
                            <Card className="hover:bg-muted hover:shadow-lg transition-all duration-200">
                                <CardHeader>
                                    <CardTitle>{doc.data().title}</CardTitle>
                                    <CardDescription>{doc.data().subject}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                     ))}
                 </div>
            ) : (
                 <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Test Series Available</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Please check back later for new test series.</p>
                </div>
            )}
        </div>
    );
}
