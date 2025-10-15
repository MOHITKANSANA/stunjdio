'use client';

import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MyApplicationTab() {
    const { user } = useAuth();
    const [applications, loading, error] = useCollection(user ? query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid), orderBy('appliedAt', 'desc')) : null);

    if (loading) return <Skeleton className="h-48 w-full" />
    if (error) return <p className="text-destructive">Could not load your applications.</p>
    if (!applications || applications.empty) return <p className="text-muted-foreground text-center p-8">You have not applied for any scholarships yet.</p>

    return (
        <div className="space-y-4">
            {applications.docs.map(doc => {
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
