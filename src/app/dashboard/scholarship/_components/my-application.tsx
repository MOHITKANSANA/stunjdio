
'use client';

import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export function MyApplicationTab() {
    const { user } = useAuth();
    
    const applicationsQuery = user 
        ? query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid), orderBy('appliedAt', 'desc')) 
        : null;
        
    const [applications, loading, error] = useCollectionData(applicationsQuery);

    if (loading) return <Skeleton className="h-48 w-full" />
    if (error) {
        return (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Could not load your applications</AlertTitle>
                <AlertDescription className="text-xs">{error.message}</AlertDescription>
            </Alert>
        );
    }
    if (!applications || applications.length === 0) return <p className="text-muted-foreground text-center p-8">You have not applied for any scholarships yet.</p>

    return (
        <div className="space-y-4">
            {applications.map((app, index) => (
                <Card key={index}>
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
            ))}
        </div>
    )
}
