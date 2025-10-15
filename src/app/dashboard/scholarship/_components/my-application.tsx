
'use client';

import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function MyApplicationTab() {
    const { user } = useAuth();
    // Fetch all applications for the user, then sort client-side to avoid index issues.
    const [applications, loading, error] = useCollection(
        user ? query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid)) : null
    );

    // Client-side sorting
    const sortedApplications = applications?.docs.sort((a, b) => {
        const dateA = a.data().appliedAt?.toDate() || 0;
        const dateB = b.data().appliedAt?.toDate() || 0;
        return dateB - dateA;
    });

    if (loading) return <Skeleton className="h-48 w-full" />
    if (error) {
        return (
            <div className="text-center text-destructive p-4 border border-destructive/50 rounded-lg">
                <AlertTriangle className="mx-auto mb-2" />
                <p className="font-semibold">Could not load your applications</p>
                <p className="text-xs">{error.message}</p>
            </div>
        );
    }
    if (!sortedApplications || sortedApplications.length === 0) return <p className="text-muted-foreground text-center p-8">You have not applied for any scholarships yet.</p>

    return (
        <div className="space-y-4">
            {sortedApplications.map(doc => {
                const app = doc.data();
                return (
                    <Card key={doc.id}>
                        <CardHeader>
                            <CardTitle>Application #{app.applicationNumber}</CardTitle>
                            <CardDescription>Status: <span className="font-bold">{app.status}</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Applied for:</strong> {app.scholarshipType}</p>
                            {app.courseTitle && <p><strong>Course:</strong> {app.courseTitle}</p>}
                             <p><strong>Result Status:</strong> {app.resultStatus || 'Pending'}</p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
